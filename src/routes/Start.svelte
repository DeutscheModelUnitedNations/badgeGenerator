<script lang="ts">
	import { type TableSchema } from '$lib/tableSchema';
	import * as XLSX from 'xlsx';
	import ImageUploader from '$lib/components/ImageUploader.svelte';

	interface Props {
		setFileData: (data: TableSchema) => void;
	}

	let { setFileData }: Props = $props();

	function parseFileToJson(buffer: ArrayBuffer, filename: string): TableSchema {
		const isCSV = filename.toLowerCase().endsWith('.csv');

		const workbook = isCSV
			? XLSX.read(new TextDecoder().decode(buffer), { type: 'string' })
			: XLSX.read(buffer, { type: 'array' });

		const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
		return XLSX.utils.sheet_to_json(firstSheet);
	}
</script>

<h1 class="text-4xl">Namens- und Länderschilder</h1>

<h3 class="text-xl">Quelldatei (.xlsx oder .csv) hier ablegen</h3>
<input
	type="file"
	accept=".xlsx,.csv"
	multiple={false}
	class="file-input file-input-bordered file-input-primary w-full max-w-lg"
	onchange={(e) => {
		const f = (e.target as HTMLInputElement).files?.[0];
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

<div class="divider mx-auto w-full max-w-lg"></div>

<a href="/img" class="btn btn-primary w-full max-w-lg">Bilderliste</a>

<div class="divider mx-auto w-full max-w-lg"></div>

<h3 class="text-xl">Beispieldatei</h3>
<div class="join">
	<a href="/sample/badges.csv" download="sample-badges.csv" class="btn btn-primary join-item">
		CSV
	</a>
</div>
