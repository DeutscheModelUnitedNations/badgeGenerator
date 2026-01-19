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
		{ title: 'Länderschild', value: 'PLACARD' },
		{ title: 'Namensschild Hochkant', value: 'VERTICAL_BADGE' },
		{ title: 'Namensschild Quer', value: 'HORIZONTAL_BADGE' }
	] as const;

	// Persisted state for type and brand
	const typeState = persistedState<PDFType>('badge-generator-type', 'PLACARD');
	const brandState = persistedState<Brand>('badge-generator-brand', 'MUN-SH');

	// Local state that syncs with persisted state (for Tabs binding)
	let type = $state<PDFType>(typeState.current);
	let brand = $state<Brand>(brandState.current);

	// Sync local state changes to persisted state
	$effect(() => { typeState.current = type; });
	$effect(() => { brandState.current = brand; });

	const brandingTabs = [
		{ title: 'MUN-SH', value: 'MUN-SH' },
		{ title: 'MUNBW', value: 'MUNBW' },
		{ title: "DMUN", value: 'DMUN' },
		{ title: "United Nations", value: "UN"}
	] as const;

	let loading = $state(false);
</script>

<button class="btn btn-ghost" onclick={() => (fileData = undefined)}>Zurück</button>
<h1 class="text-4xl">Generator</h1>
<Tabs tabs={typeTabs} bind:activeTab={type} disabled={loading} />
<Tabs tabs={brandingTabs} bind:activeTab={brand} disabled={loading} />

<div class="w-full max-w-5xl">
	<PDFPreviewer
		{fileData}
		{type}
		{brand}
		downloadFilename={type === 'PLACARD'
			? 'placards.pdf'
			: type === 'VERTICAL_BADGE'
				? 'vertical-badges.pdf'
				: 'horizontal-badges.pdf'}
		bind:loading
	/>
</div>
