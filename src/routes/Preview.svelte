<script lang="ts">
	import { persistedState } from 'svelte-persisted-state';
	import Tabs from '$lib/components/Tabs.svelte';
	import type { Brand, PlacardTemplateMode } from '$lib/types';
	import PDFPreviewer from '$lib/components/PDFPreviewer.svelte';
	import type { PDFType } from '$lib/types';
	import type { TableSchema } from '$lib/tableSchema';
	import { getWarnings } from '$lib/stores/warnings.svelte';
	import { PDFDocument } from 'pdf-lib';

	interface Props {
		fileData: TableSchema | undefined;
	}

	let { fileData = $bindable() }: Props = $props();

	const typeTabs = [
		{ title: 'Länderschild', value: 'PLACARD', icon: 'fa-solid fa-sign-hanging' },
		{ title: 'Namensschild Hochkant', value: 'VERTICAL_BADGE', icon: 'fa-solid fa-address-card' },
		{ title: 'Namensschild Quer', value: 'HORIZONTAL_BADGE', icon: 'fa-solid fa-id-card' }
	] as const;

	// Persisted state for type, brand, and trim border
	const typeState = persistedState<PDFType>('badge-generator-type', 'PLACARD');
	const brandState = persistedState<Brand>('badge-generator-brand', 'MUN-SH');
	const trimBorderState = persistedState<'SHOW' | 'HIDE'>('badge-generator-trim-border', 'HIDE');

	// Local state that syncs with persisted state (for Tabs binding)
	let type = $state<PDFType>(typeState.current);
	let brand = $state<Brand>(brandState.current);
	let trimBorder = $state<'SHOW' | 'HIDE'>(trimBorderState.current);

	// Derived value for the generators
	let showTrimBorder = $derived(trimBorder === 'SHOW');

	// Sync local state changes to persisted state
	$effect(() => { typeState.current = type; });
	$effect(() => { brandState.current = brand; });
	$effect(() => { trimBorderState.current = trimBorder; });

	const brandingTabs = [
		{ title: 'MUN-SH', value: 'MUN-SH', icon: 'fa-solid fa-tag' },
		{ title: 'MUNBW', value: 'MUNBW', icon: 'fa-solid fa-tag' },
		{ title: 'DMUN', value: 'DMUN', icon: 'fa-solid fa-tag' },
		{ title: 'United Nations', value: 'UN', icon: 'fa-solid fa-globe' }
	] as const;

	const trimBorderTabs = [
		{ title: 'Ohne Schnittrand', value: 'HIDE', icon: 'fa-solid fa-border-none' },
		{ title: 'Mit Schnittrand', value: 'SHOW', icon: 'fa-solid fa-border-all' }
	] as const;

	// Template state (non-persisted since PDF needs re-upload each session)
	let templateFile = $state<File | null>(null);
	let templateBytes = $state<Uint8Array | null>(null);
	let templateMode = $state<PlacardTemplateMode>('front');
	let templateError = $state<string | null>(null);
	let templatePageCount = $state<number>(0);

	const templateModeTabs = [
		{ title: 'Vorderseite', value: 'front', icon: 'fa-solid fa-image' },
		{ title: 'Ruckseite', value: 'back', icon: 'fa-solid fa-file' },
		{ title: 'Beides', value: 'both', icon: 'fa-solid fa-copy' }
	] as const;

	async function handleTemplateUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (!file) {
			templateFile = null;
			templateBytes = null;
			templateError = null;
			templatePageCount = 0;
			return;
		}

		if (file.type !== 'application/pdf') {
			templateError = 'Bitte eine PDF-Datei hochladen.';
			templateFile = null;
			templateBytes = null;
			templatePageCount = 0;
			return;
		}

		try {
			const arrayBuffer = await file.arrayBuffer();
			const bytes = new Uint8Array(arrayBuffer);

			// Validate PDF by loading it
			const pdfDoc = await PDFDocument.load(bytes);
			const pageCount = pdfDoc.getPageCount();

			templateFile = file;
			templateBytes = bytes;
			templatePageCount = pageCount;
			templateError = null;

			// Auto-adjust mode if needed
			if (templateMode === 'both' && pageCount < 2) {
				templateMode = 'front';
			}
		} catch (error) {
			templateError = 'Die PDF-Datei konnte nicht gelesen werden. Bitte eine gültige PDF-Datei hochladen.';
			templateFile = null;
			templateBytes = null;
			templatePageCount = 0;
		}
	}

	function clearTemplate() {
		templateFile = null;
		templateBytes = null;
		templateError = null;
		templatePageCount = 0;
	}

	// Check if current mode is invalid (for passing to PDFPreviewer)
	let templateModeInvalid = $derived(templateMode === 'both' && templatePageCount > 0 && templatePageCount < 2);

	let loading = $state(false);
</script>

<button class="btn btn-ghost" onclick={() => (fileData = undefined)}>
	<i class="fa-solid fa-arrow-left w-5 h-5"></i>
	Zurück
</button>
<h1 class="text-4xl">Generator</h1>
<Tabs tabs={typeTabs} bind:activeTab={type} disabled={loading} />
<Tabs tabs={brandingTabs} bind:activeTab={brand} disabled={loading} />
{#if type !== 'PLACARD'}
	<Tabs tabs={trimBorderTabs} bind:activeTab={trimBorder} disabled={loading} />
{/if}

{#if type === 'PLACARD'}
	<div class="w-full max-w-5xl mt-4 p-4 border border-base-300 rounded-lg bg-base-200">
		<h3 class="font-bold mb-2">Vorlage (optional)</h3>
		<p class="text-sm text-base-content/70 mb-3">
			Lade eine PDF-Vorlage hoch, die als Hintergrund oder Rückseite verwendet wird.
		</p>

		<div class="flex flex-col gap-3">
			<div class="flex items-center gap-2">
				<input
					type="file"
					accept="application/pdf"
					class="file-input file-input-bordered file-input-sm w-full"
					onchange={handleTemplateUpload}
					disabled={loading}
				/>
				{#if templateFile}
					<button class="btn btn-ghost btn-sm" onclick={clearTemplate} disabled={loading} aria-label="Vorlage entfernen">
						<i class="fa-solid fa-xmark"></i>
					</button>
				{/if}
			</div>

			{#if templateError}
				<div class="alert alert-error alert-sm">
					<i class="fa-solid fa-circle-exclamation"></i>
					<span>{templateError}</span>
				</div>
			{:else if templateFile}
				<div class="alert alert-success alert-sm">
					<i class="fa-solid fa-check-circle"></i>
					<span>Vorlage geladen: {templateFile.name} ({templatePageCount} {templatePageCount === 1 ? 'Seite' : 'Seiten'})</span>
				</div>

				<Tabs tabs={templateModeTabs} bind:activeTab={templateMode} disabled={loading} />

				<div class="text-sm text-base-content/70">
					{#if templateMode === 'front'}
						Die erste Seite der Vorlage wird als Hintergrund auf der Vorderseite (untere Hälfte) angezeigt.
					{:else if templateMode === 'back'}
						Die erste Seite der Vorlage wird nach jedem Länderschild als Rückseite eingefügt (für Duplexdruck).
					{:else}
						Seite 1 der Vorlage als Vorderseiten-Hintergrund, Seite 2 als Rückseite.
					{/if}
				</div>

				{#if templateMode === 'both' && templatePageCount < 2}
					<div class="alert alert-warning alert-sm">
						<i class="fa-solid fa-triangle-exclamation"></i>
						<span>Für den Modus "Beides" wird eine PDF mit mindestens 2 Seiten benötigt.</span>
					</div>
				{/if}
			{/if}
		</div>
	</div>
{/if}

<div class="w-full max-w-5xl">
	<PDFPreviewer
		{fileData}
		{type}
		{brand}
		{showTrimBorder}
		placardTemplate={templateBytes && type === 'PLACARD' && !templateError && !templateModeInvalid ? { templateBytes, mode: templateMode } : undefined}
		downloadFilename={type === 'PLACARD'
			? 'placards.pdf'
			: type === 'VERTICAL_BADGE'
				? 'vertical-badges.pdf'
				: 'horizontal-badges.pdf'}
		bind:loading
	/>
</div>
