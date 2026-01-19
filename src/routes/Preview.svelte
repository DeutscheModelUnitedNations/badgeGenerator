<script lang="ts">
	import { persistedState } from 'svelte-persisted-state';
	import Tabs from '$lib/components/Tabs.svelte';
	import type { Brand } from '$lib/types';
	import PDFPreviewer from '$lib/components/PDFPreviewer.svelte';
	import type { PDFType } from '$lib/types';
	import type { TableSchema } from '$lib/tableSchema';
	import { getWarnings } from '$lib/stores/warnings.svelte';

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

<div class="w-full max-w-5xl">
	<PDFPreviewer
		{fileData}
		{type}
		{brand}
		{showTrimBorder}
		downloadFilename={type === 'PLACARD'
			? 'placards.pdf'
			: type === 'VERTICAL_BADGE'
				? 'vertical-badges.pdf'
				: 'horizontal-badges.pdf'}
		bind:loading
	/>
</div>
