<script lang="ts">
	import { onMount } from 'svelte';
	import { type TableSchema, type TableRow } from '$lib/tableSchema';
	import * as XLSX from 'xlsx';
	import ImageUploader from '$lib/components/ImageUploader.svelte';
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
	let committee = $state('');
	let pronouns = $state('');
	let id = $state('');
	let mediaConsentStatus = $state<'NOT_SET' | 'NOT_ALLOWED' | 'PARTIALLY_ALLOWED' | 'ALLOWED_ALL'>('NOT_SET');

	// Country input mode: 'select' for dropdown, 'input' for manual entry
	let countryInputMode = $state<'select' | 'input'>('select');

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
	function switchCountryInputMode(newMode: 'select' | 'input') {
		countryInputMode = newMode;
		countryName = '';
		countryAlpha2Code = '';
	}

	// Submit handler for single mode
	function submitSingle() {
		if (!name || !countryName || !countryAlpha2Code) return;

		const entry: TableRow = {
			name,
			countryName,
			countryAlpha2Code: countryAlpha2Code || undefined,
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
		class="tab"
		class:tab-active={mode === 'file'}
		onclick={() => (mode = 'file')}
	>
		Datei-Upload
	</button>
	<button
		role="tab"
		class="tab"
		class:tab-active={mode === 'single'}
		onclick={() => (mode = 'single')}
	>
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
			<div role="tablist" class="tabs tabs-box tabs-sm mb-2">
				<button
					type="button"
					role="tab"
					class="tab"
					class:tab-active={countryInputMode === 'select'}
					onclick={() => switchCountryInputMode('select')}
				>
					Auswahl
				</button>
				<button
					type="button"
					role="tab"
					class="tab"
					class:tab-active={countryInputMode === 'input'}
					onclick={() => switchCountryInputMode('input')}
				>
					Eingabe
				</button>
			</div>

			{#if countryInputMode === 'select'}
				<!-- Country dropdown -->
				<select
					class="select w-full"
					onchange={(e) => handleCountrySelect((e.target as HTMLSelectElement).value)}
					required
				>
					<option value="" disabled selected={!countryAlpha2Code}>Land auswählen...</option>
					{#each countryOptions as country}
						<option value={country.code} selected={countryAlpha2Code === country.code}>
							{country.name}
						</option>
					{/each}
				</select>
			{:else}
				<!-- Manual country input -->
				<div class="flex gap-2">
					<input
						type="text"
						placeholder="Ländername"
						class="input flex-1"
						bind:value={countryName}
						required
					/>
					<input
						type="text"
						placeholder="Code (z.B. DE)"
						class="input w-24"
						bind:value={countryAlpha2Code}
						maxlength="2"
						required
					/>
				</div>
				<p class="fieldset-label">ISO 3166-1 alpha-2 Code oder "UN"</p>
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
			disabled={!name || !countryAlpha2Code}
		>
			Schild erstellen
		</button>
	</form>
{/if}

<div class="divider mx-auto w-full max-w-lg"></div>

<a href="/img" class="btn btn-primary w-full max-w-lg">Bilderliste</a>
