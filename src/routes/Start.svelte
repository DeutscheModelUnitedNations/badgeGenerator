<script lang="ts">
	import { placardSchema, type PlacardDataTable } from '$lib/tableSchema';
	import * as XLSX from 'xlsx';
	import ImageUploader from '$lib/components/ImageUploader.svelte';
	import { onMount } from 'svelte';

	interface Props {
		setFileData: (data: PlacardDataTable) => void;
	}

	let { setFileData }: Props = $props();

	let sheetsUrl = $state('');

	onMount(() => {
		const savedUrl = localStorage.getItem('sheetsUrl');
		if (savedUrl) sheetsUrl = savedUrl;
	});

	// Update local storage when sheetsUrl changes.
	$effect(() => localStorage.setItem('sheetsUrl', sheetsUrl));

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

<div class="text-xl">ODER</div>

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

<div class="divider mx-auto w-full max-w-lg"></div>

<a href="/img" class="btn btn-primary w-full max-w-lg">Bilderliste</a>

<div class="divider mx-auto w-full max-w-lg"></div>

<h3 class="text-xl">Beispieldateien</h3>
<div class="join">
	<a href="/sample/badges.csv" download="sample-badges.csv" class="btn btn-primary join-item">
		Namensschilder CSV
	</a>
	<a href="/sample/placards.csv" download="sample-placards.csv" class="btn btn-primary join-item">
		Länderschilder CSV
	</a>
</div>
