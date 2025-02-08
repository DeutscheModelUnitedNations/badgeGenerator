<script lang="ts">
	import { placardSchema, type PlacardDataTable } from '$lib/tableSchema';
	import * as XLSX from 'xlsx';

	interface Props {
		setFileData: (data: PlacardDataTable) => void;
	}

	let { setFileData }: Props = $props();

	let sheetsUrl = $state(
		'https://docs.google.com/spreadsheets/d/1HQIc7k8NGnO5YRxxx0RJ-zxQhjlH4534DQAEVEjHNJA/edit?gid=0#gid=0'
	);
	let loading = $state(false);

	async function fetchGoogleSheets(url: string) {
		try {
			loading = true;
			const match = url.match(/spreadsheets\/d\/([^/]+)/);
			if (!match) throw new Error('Invalid Google Sheets URL');

			const spreadsheetId = match[1];
			const response = await fetch(`/api/sheets?id=${spreadsheetId}`);
			const data = await response.json();
			if (data.error) throw new Error(data.message);
			setFileData(data);
		} catch (error) {
			console.error('Error fetching sheet:', error);
			alert(`Error fetching Google Sheet:\n${error}`);
		} finally {
			loading = false;
		}
	}

	function parseFileToJson(buffer: ArrayBuffer, filename: string) {
		const isCSV = filename.toLowerCase().endsWith('.csv');

		const workbook = isCSV
			? XLSX.read(new TextDecoder().decode(buffer), { type: 'string' })
			: XLSX.read(buffer, { type: 'array' });

		const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
		return XLSX.utils.sheet_to_json(firstSheet);
	}

	let imgInput: HTMLInputElement;
	let imgFiles = $state<FileList>();
	let imgTitle = $state<string>();

	function getBase64(image: File) {
		const reader = new FileReader();
		reader.readAsDataURL(image);

		const nameParts = image.name.split('.');
		if (nameParts.length !== 2) {
			alert('Image filename must contain exactly one dot (i.e., a base name and an extension).');
			return;
		}

		reader.onload = (e) => {
			uploadImage(e.target.result, imgTitle || nameParts[0], nameParts[1]);
		};
	}

	async function uploadImage(img: Base64URLString, title: string, extension: string) {
		const data = {
			image: img,
			title,
			extension
		};

		const response = await fetch('/img', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json'
			},
			body: JSON.stringify(data)
		});

		const result = await response.json();

		console.log(result);
	}
</script>

<h1 class="text-4xl">Name Tag Generator</h1>

<h3 class="text-xl">Quelldatei (.xlsx oder .csv) hier ablegen</h3>
<input
	type="file"
	accept=".xlsx,.csv"
	multiple={false}
	class="file-input file-input-bordered file-input-primary w-full max-w-lg"
	onchange={(e) => {
		const f = e.target.files[0];
		if (f) {
			const reader = new FileReader();
			reader.onload = (e) => {
				const buffer = e.target?.result as ArrayBuffer;
				setFileData(parseFileToJson(buffer, f.name));
			};
			reader.readAsArrayBuffer(f);
		}
	}}
/>

<div class="">ODER</div>

<div class="join w-full max-w-lg">
	<input
		type="text"
		placeholder="Google Sheets URL"
		class="input join-item input-bordered input-primary flex-1"
		bind:value={sheetsUrl}
	/>
	<button class="btn btn-primary join-item" onclick={() => fetchGoogleSheets(sheetsUrl)}>
		{#if loading}
			<span class="loading loading-dots"></span>
		{:else}
			<span>Google Sheets laden</span>
		{/if}
	</button>
</div>

<div class="divider"></div>

<input
	type="file"
	accept=".png, .jpg, .jpeg"
	bind:files={imgFiles}
	bind:this={imgInput}
	onchange={() => getBase64(imgFiles[0])}
	class="hidden"
	id="imgInput"
/>
<div class="join join-vertical w-full max-w-lg">
	<input
		type="text"
		placeholder="Bildname (optional, Dateiendung wird automatisch ergänzt)"
		bind:value={imgTitle}
		class="input join-item input-bordered input-primary"
	/>
	<button class="btn btn-primary join-item" onclick={() => imgInput.click()}>Bild hochladen</button>
</div>

<div class="divider"></div>

<h3 class="text-xl">Beispieldateien</h3>
<div class="join">
	<a href="/sample/badges.csv" download="sample-badges.csv" class="btn btn-primary join-item">
		Namensschilder CSV
	</a>
	<a href="/sample/placards.csv" download="sample-placards.csv" class="btn btn-primary join-item">
		Länderschilder CSV
	</a>
</div>
