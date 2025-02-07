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
		const data = XLSX.utils.sheet_to_json(firstSheet);

		const { success } = placardSchema.safeParse(data);
		if (!success) {
			console.error('Invalid CSV format');
			alert(`Invalid ${isCSV ? 'CSV' : 'XLSX'} format`);
			return;
		}
		return data;
	}
</script>

<h1 class="text-4xl text-white">Name Tag Generator</h1>

<h3 class="text-xl text-white">Quelldatei (.xlsx oder .csv) hier ablegen</h3>
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

<div class="divider text-white">ODER</div>

<div class="join w-full max-w-lg">
	<input
		type="text"
		placeholder="Google Sheets URL"
		class="input join-item input-bordered flex-1"
		bind:value={sheetsUrl}
	/>
	<button class="btn btn-primary join-item" onclick={() => fetchGoogleSheets(sheetsUrl)}>
		{#if loading}
			<span class="loading loading-dots text-white"></span>
		{:else}
			<span>Google Sheets laden</span>
		{/if}
	</button>
</div>
