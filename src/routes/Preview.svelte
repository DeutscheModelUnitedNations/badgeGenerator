<script lang="ts">
	import Tabs from '$lib/components/Tabs.svelte';
	import type { Brand } from '$lib/types';
	import PDFPreviewer from '$lib/components/PDFPreviewer.svelte';
	import type { PDFType } from '$lib/types';
	import type { TableSchema } from '$lib/tableSchema';

	interface Props {
		fileData: TableSchema | undefined;
	}

	let { fileData = $bindable() }: Props = $props();

	const typeTabs = [
		{ title: 'Länderschild', value: 'PLACARD' },
		{ title: 'Namensschild Hochkant', value: 'VERTICAL_BADGE' },
		{ title: 'Namensschild Quer', value: 'HORIZONTAL_BADGE' }
	] as const;
	let type = $state<PDFType>('PLACARD');

	const brandingTabs = [
		{ title: 'MUN-SH', value: 'MUN-SH' },
		{ title: 'MUNBW', value: 'MUNBW' }
	] as const;
	let brand = $state<Brand>('MUN-SH');

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
