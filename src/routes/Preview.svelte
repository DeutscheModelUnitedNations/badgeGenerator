<script lang="ts">
	import Tabs from '$lib/components/Tabs.svelte';
	import { badgeSchema, placardSchema, type PlacardDataTable } from '$lib/tableSchema';
	import type { Brand } from '$lib/brands';
	import PDFPreviewer from '$lib/components/PDFPreviewer.svelte';
	import { generatePlacardPDF } from '$lib/placardGeneration';
	import { generateVerticalBadgePDF } from '$lib/verticalBadgeGeneration';
	import { generateHorizontalBadgePDF } from '$lib/horizontalBadgeGeneration';

	interface Props {
		fileData: PlacardDataTable | undefined;
	}

	let { fileData = $bindable() }: Props = $props();

	const typeTabs = [
		{ title: 'Länderschild', value: 'PLACARD' },
		{ title: 'Namensschild Hochkant', value: 'VERTICAL_BADGE' },
		{ title: 'Namensschild Quer', value: 'HORIZONTAL_BADGE' }
	] as const;
	let type = $state<'PLACARD' | 'VERTICAL_BADGE' | 'HORIZONTAL_BADGE'>('PLACARD');

	const brandingTabs = [
		{ title: 'MUN-SH', value: 'MUN-SH' },
		{ title: 'MUNBW', value: 'MUNBW' }
	] as const;
	let brand = $state<Brand>('MUN-SH');

	let commonPDFViewerProps = $derived({
		fileData,
		brand,
		schema: type === 'PLACARD' ? placardSchema : badgeSchema,
		downloadFilename:
			type === 'PLACARD'
				? 'placards.pdf'
				: type === 'VERTICAL_BADGE'
					? 'vertical-badges.pdf'
					: 'horizontal-badges.pdf'
	});
</script>

<button class="btn btn-ghost" onclick={() => (fileData = undefined)}>Zurück</button>
<h1 class="text-4xl">Generator</h1>
<Tabs tabs={typeTabs} bind:activeTab={type} />
<Tabs tabs={brandingTabs} bind:activeTab={brand} />

<div class="w-full max-w-5xl">
	{#if type === 'PLACARD'}
		<PDFPreviewer generatePDF={generatePlacardPDF} {...commonPDFViewerProps} />
	{:else if type === 'VERTICAL_BADGE'}
		<PDFPreviewer generatePDF={generateVerticalBadgePDF} {...commonPDFViewerProps} />
	{:else if type === 'HORIZONTAL_BADGE'}
		<PDFPreviewer generatePDF={generateHorizontalBadgePDF} {...commonPDFViewerProps} />
	{/if}
</div>
