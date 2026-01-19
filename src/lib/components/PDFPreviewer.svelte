<script lang="ts">
	import WarningTable from './WarningTable.svelte';

	import { generatePDF } from '$lib/pdfCommon';
	import {
		getGenerationProgressPercent,
		getGenerationProgressText
	} from '$lib/stores/progress.svelte';
	import { tableSchema, type TableRow } from '$lib/tableSchema';
	import type { Brand, PDFType } from '$lib/types';
	import type { SafeParseError } from 'zod';
	import { getWarnings } from '$lib/stores/warnings.svelte';

	interface Props {
		fileData: any;
		brand: Brand;
		type: PDFType;
		downloadFilename: string;
		loading: boolean;
	}
	let { fileData, brand, type, downloadFilename, loading = $bindable() }: Props = $props();

	let validationFailed = $state<SafeParseError<TableRow>['error']['issues']>([]);
	let pdfUrl = $state('');

	async function generatePreview() {
		try {
			const pdfBytes = await generatePDF(fileData, brand, type);
			const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
			pdfUrl = URL.createObjectURL(blob);
		} catch (error) {
			console.error('Error generating preview:', error);
		} finally {
			loading = false;
		}
	}

	const generate = async () => {
		loading = true;
		await generatePreview();
		return () => {
			if (pdfUrl) URL.revokeObjectURL(pdfUrl);
		};
	};

	$effect(() => {
		if (fileData) {
			const { success, error } = tableSchema.safeParse(fileData);
			if (!success) {
				validationFailed = error.issues;
				return;
			}
		}
	});

	$effect(() => {
		if (brand) {
			pdfUrl = '';
		}
		if (type) {
			pdfUrl = '';
		}
	});
</script>

<div class="flex w-full flex-col items-center justify-center gap-4">
	{#if validationFailed && validationFailed.length > 0}
		<div class="alert alert-warning !flex w-auto !flex-col !items-center !justify-center">
			<div class="text-center">
				<strong>Datenvalidierung Fehlgeschlagen</strong><br />Die Datei enthält Fehler, die das
				Erstellen des PDFs verhindern. Bitte korrigiere die Fehler und versuche es erneut.
			</div>
			<WarningTable errors={validationFailed} />
		</div>
	{:else if loading}
		<div class="flex flex-col items-center justify-center gap-2">
			<span class="loading loading-dots loading-lg text-primary"></span>
			<progress
				class="progress progress-primary w-56"
				value={getGenerationProgressPercent() ?? 0}
				max="100"
			></progress>
			<div class="flex items-center justify-center gap-1 font-mono">
				<span class="badge">{getGenerationProgressText()}</span>
				<span class="badge">{getGenerationProgressPercent()}%</span>
			</div>
		</div>
		<div class="alert alert-warning text-center">
			<span>
				<strong>Der Prozess kann je nach Seitenanzahl mehrere Minuten in Anspruch nehmen.</strong
				><br />Manchmal hängt der Fortschrittsbalken gerade bei vielen Seiten bei oder kurz vor
				100%. Bitte warten, bis das PDF angezeigt wird. Wenn die Seite abstürzt, lohnt es sich, auf
				"warten" zu klicken.
			</span>
		</div>
	{:else if pdfUrl === ''}
		{#if fileData.length > 79}
			<div class="alert alert-warning w-auto">
				<div class="text-center">
					<strong
						>Datensätze mit vielen Reihen (> 80) können zu langen Ladezeiten und sogar zu Abstürzen
						führen.</strong
					><br />Probieren könnt ihr es trotzdem – aber wenn es nicht funktioniert, teilt die Datei
					in kleinere Teile auf.
				</div>
			</div>
		{/if}
		<button class="btn btn-primary w-full max-w-lg" disabled={loading} onclick={generate}>
			Generate PDF
		</button>
		<div class="alert w-auto">
			<div class="grid grid-cols-2 items-center gap-2">
				<div class="col-span-2 font-bold">Datensatz</div>
				<div>Anzahl:</div>
				<div class="badge">{fileData.length}</div>
				<div>Mit Flagge:</div>
				<div class="badge">
					{fileData.filter((row: TableRow) => !!row.countryAlpha2Code && !row.alternativeImage)
						.length}
				</div>
				<div>Mit Bild:</div>
				<div class="badge">
					{fileData.filter((row: TableRow) => !!row.alternativeImage).length}
				</div>
			</div>
		</div>
	{:else}
		<div class="alert alert-warning !flex w-auto !flex-col !items-center !justify-center">
			<div class="text-center">
				<strong>Warnungen</strong><br />Bei der PDF-Erstellung sind ein paar Warnungen aufgetreten.
				Bitte prüfe sie gründlich.
			</div>
			<WarningTable errors={getWarnings()} />
		</div>
		<button
			class="btn btn-primary w-full max-w-lg"
			onclick={() => {
				const link = document.createElement('a');
				link.href = pdfUrl;
				link.download = downloadFilename;
				link.click();
			}}
		>
			Download PDF
		</button>
		<embed src={pdfUrl} type="application/pdf" class=" h-[80vh] w-full rounded-lg bg-white" />
	{/if}
</div>
