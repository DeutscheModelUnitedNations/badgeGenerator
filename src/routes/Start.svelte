<script lang="ts">
	import { onMount } from 'svelte';
	import { type TableSchema, type TableRow } from '$lib/tableSchema';
	import * as XLSX from 'xlsx';
	import ImageUploader from '$lib/components/ImageUploader.svelte';
	import ImageSelectModal from '$lib/components/ImageSelectModal.svelte';
	import CountrySelectModal from '$lib/components/CountrySelectModal.svelte';
	import WorldCountries from 'world-countries';

	interface Props {
		setFileData: (data: TableSchema) => void;
		initialParams?: {
			name?: string;
			country?: string;
			committee?: string;
			pronouns?: string;
			id?: string;
			media?: string;
		};
		hasUrlParams?: boolean;
	}

	let { setFileData, initialParams, hasUrlParams }: Props = $props();

	// Mode state: 'file' for file upload, 'single' for single entry
	let mode = $state<'file' | 'single'>('file');

	// Form fields for single mode
	let name = $state('');
	let countryName = $state('');
	let countryAlpha2Code = $state('');
	let alternativeImage = $state('');
	let committee = $state('');
	let pronouns = $state('');
	let id = $state('');
	let mediaConsentStatus = $state<'NOT_SET' | 'NOT_ALLOWED' | 'PARTIALLY_ALLOWED' | 'ALLOWED_ALL'>('NOT_SET');

	// Country input mode: 'country' for country selection, 'image' for custom image
	let countryInputMode = $state<'country' | 'image'>('country');

	// Modal visibility state
	let showImageModal = $state(false);
	let showCountryModal = $state(false);

	// Optional override for country display name
	let countryNameOverride = $state('');

	// Country options for dropdown
	const countryOptions = [
		{ name: 'Vereinte Nationen (UN)', code: 'UN' },
		...WorldCountries.map((c) => ({
			name: c.translations.deu?.common ?? c.name.common,
			code: c.cca2
		})).sort((a, b) => a.name.localeCompare(b.name, 'de'))
	];

	// Handle country selection
	function handleCountrySelect(code: string) {
		countryAlpha2Code = code;
		if (code === 'UN') {
			countryName = 'Vereinte Nationen';
		} else {
			const country = WorldCountries.find((c) => c.cca2 === code);
			if (country) {
				countryName = country.translations.deu?.common ?? country.name.common;
			}
		}
	}

	// Reset country fields when switching input mode
	function switchCountryInputMode(newMode: 'country' | 'image') {
		countryInputMode = newMode;
		countryName = '';
		countryAlpha2Code = '';
		alternativeImage = '';
		countryNameOverride = '';
	}

	// Submit handler for single mode
	function submitSingle() {
		// Validate based on mode
		if (countryInputMode === 'image') {
			if (!name || !countryName || !alternativeImage) return;
		} else {
			if (!name || !countryName || !countryAlpha2Code) return;
		}

		// Use override name if provided, otherwise use the selected country name
		const displayName = countryInputMode === 'country' && countryNameOverride.trim()
			? countryNameOverride.trim()
			: countryName;

		const entry: TableRow = {
			name,
			countryName: displayName,
			countryAlpha2Code: countryInputMode !== 'image' ? (countryAlpha2Code || undefined) : undefined,
			alternativeImage: countryInputMode === 'image' ? alternativeImage : undefined,
			committee: committee || undefined,
			pronouns: pronouns || undefined,
			id: id || undefined,
			mediaConsentStatus
		};
		setFileData([entry]);
	}

	function parseFileToJson(buffer: ArrayBuffer, filename: string): TableSchema {
		const isCSV = filename.toLowerCase().endsWith('.csv');

		const workbook = isCSV
			? XLSX.read(new TextDecoder().decode(buffer), { type: 'string' })
			: XLSX.read(buffer, { type: 'array' });

		const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
		return XLSX.utils.sheet_to_json(firstSheet);
	}

	// Initialize form from URL params
	onMount(() => {
		if (hasUrlParams && initialParams) {
			mode = 'single';
			if (initialParams.name) name = initialParams.name;
			if (initialParams.country) {
				const code = initialParams.country.toUpperCase();
				countryAlpha2Code = code;
				handleCountrySelect(code);
			}
			if (initialParams.committee) committee = initialParams.committee;
			if (initialParams.pronouns) pronouns = initialParams.pronouns;
			if (initialParams.id) id = initialParams.id;
			if (initialParams.media) {
				const mediaValue = initialParams.media.toUpperCase();
				if (['NOT_SET', 'NOT_ALLOWED', 'PARTIALLY_ALLOWED', 'ALLOWED_ALL'].includes(mediaValue)) {
					mediaConsentStatus = mediaValue as typeof mediaConsentStatus;
				}
			}
		}
	});
</script>

<h1 class="text-4xl">Namens- und Länderschilder</h1>

<!-- Mode toggle tabs -->
<div role="tablist" class="tabs tabs-box w-full max-w-lg">
	<button
		role="tab"
		class="tab flex-1"
		class:tab-active={mode === 'file'}
		onclick={() => (mode = 'file')}
	>
		<i class="fa-solid fa-file-arrow-up w-4 h-4 mr-2"></i>
		Datei-Upload
	</button>
	<button
		role="tab"
		class="tab flex-1"
		class:tab-active={mode === 'single'}
		onclick={() => (mode = 'single')}
	>
		<i class="fa-solid fa-keyboard w-4 h-4 mr-2"></i>
		Einzeleingabe
	</button>
</div>

{#if mode === 'file'}
	<!-- File upload mode -->
	<h3 class="text-xl">Quelldatei (.xlsx oder .csv) hier ablegen</h3>
	<input
		type="file"
		accept=".xlsx,.csv"
		multiple={false}
		class="file-input file-input-primary w-full max-w-lg"
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

	<h3 class="text-xl">Beispieldatei</h3>
	<div class="join">
		<a href="/sample/badges.csv" download="sample-badges.csv" class="btn btn-primary join-item">
			<i class="fa-solid fa-download w-4 h-4"></i>
			CSV
		</a>
	</div>
{:else}
	<!-- Single entry mode -->
	<form class="w-full max-w-lg space-y-4" onsubmit={(e) => { e.preventDefault(); submitSingle(); }}>
		<!-- Name (required) -->
		<fieldset class="fieldset w-full">
			<legend class="fieldset-legend">Name *</legend>
			<input
				type="text"
				placeholder="Max Mustermann"
				class="input w-full"
				bind:value={name}
				required
			/>
		</fieldset>

		<!-- Country input mode toggle -->
		<fieldset class="fieldset w-full">
			<legend class="fieldset-legend">Land *</legend>
			<div role="tablist" class="tabs tabs-box tabs-sm mb-2 w-full">
				<button
					type="button"
					role="tab"
					class="tab flex-1"
					class:tab-active={countryInputMode === 'country'}
					onclick={() => switchCountryInputMode('country')}
				>
					<i class="fa-solid fa-flag w-3 h-3 mr-1"></i>
					Land
				</button>
				<button
					type="button"
					role="tab"
					class="tab flex-1"
					class:tab-active={countryInputMode === 'image'}
					onclick={() => switchCountryInputMode('image')}
				>
					<i class="fa-solid fa-image w-3 h-3 mr-1"></i>
					Bild
				</button>
			</div>

			{#if countryInputMode === 'country'}
				<!-- Country selection with modal -->
				<div class="flex gap-2 mb-2">
					<input
						type="text"
						placeholder="Land auswählen..."
						class="input flex-1"
						value={countryName}
						readonly
					/>
					<button type="button" class="btn btn-primary" onclick={() => showCountryModal = true}>
						<i class="fa-solid fa-magnifying-glass w-4 h-4"></i>
						Suchen
					</button>
				</div>
				<input
					type="text"
					placeholder="Anzeigename überschreiben (optional)"
					class="input w-full"
					bind:value={countryNameOverride}
				/>
				<p class="fieldset-label">Optional: Eigenen Namen für das Land angeben</p>
			{:else if countryInputMode === 'image'}
				<!-- Alternative image input -->
				<input
					type="text"
					placeholder="Anzeigename (z.B. Vereinte Nationen)"
					class="input w-full mb-2"
					bind:value={countryName}
					required
				/>
				<div class="flex gap-2">
					<input
						type="text"
						placeholder="Bild auswählen..."
						class="input flex-1"
						value={alternativeImage}
						readonly
					/>
					<button type="button" class="btn btn-primary" onclick={() => showImageModal = true}>
						<i class="fa-solid fa-magnifying-glass w-4 h-4"></i>
						Suchen
					</button>
				</div>
				<p class="fieldset-label">Wähle ein Bild aus der Bilderliste</p>
			{/if}
		</fieldset>

		<!-- Committee (optional) -->
		<fieldset class="fieldset w-full">
			<legend class="fieldset-legend">Ausschuss</legend>
			<input
				type="text"
				placeholder="z.B. Generalversammlung"
				class="input w-full"
				bind:value={committee}
			/>
		</fieldset>

		<!-- Pronouns (optional) -->
		<fieldset class="fieldset w-full">
			<legend class="fieldset-legend">Pronomen</legend>
			<input
				type="text"
				placeholder="z.B. sie/ihr"
				class="input w-full"
				bind:value={pronouns}
			/>
		</fieldset>

		<!-- ID (optional) -->
		<fieldset class="fieldset w-full">
			<legend class="fieldset-legend">ID</legend>
			<input
				type="text"
				placeholder="z.B. 12345"
				class="input w-full"
				bind:value={id}
			/>
		</fieldset>

		<!-- Media consent status (optional) -->
		<fieldset class="fieldset w-full">
			<legend class="fieldset-legend">Medienfreigabe</legend>
			<select class="select w-full" bind:value={mediaConsentStatus}>
				<option value="NOT_SET">Nicht festgelegt</option>
				<option value="ALLOWED_ALL">Vollständig erlaubt</option>
				<option value="PARTIALLY_ALLOWED">Teilweise erlaubt</option>
				<option value="NOT_ALLOWED">Nicht erlaubt</option>
			</select>
		</fieldset>

		<!-- Submit button -->
		<button
			type="submit"
			class="btn btn-primary w-full"
			disabled={!name || !countryName || (countryInputMode === 'image' ? !alternativeImage : !countryAlpha2Code)}
		>
			Schild erstellen
			<i class="fa-solid fa-arrow-right w-4 h-4"></i>
		</button>
	</form>
{/if}

{#if showImageModal}
	<ImageSelectModal
		onSelect={(title) => {
			alternativeImage = title;
			showImageModal = false;
		}}
		onClose={() => showImageModal = false}
	/>
{/if}

{#if showCountryModal}
	<CountrySelectModal
		onSelect={(code, name) => {
			countryAlpha2Code = code;
			countryName = name;
			showCountryModal = false;
		}}
		onClose={() => showCountryModal = false}
	/>
{/if}

<div class="divider mx-auto w-full max-w-lg"></div>

<a href="/img" class="btn btn-primary w-full max-w-lg">
	<i class="fa-solid fa-images w-5 h-5"></i>
	Bilderliste
</a>
