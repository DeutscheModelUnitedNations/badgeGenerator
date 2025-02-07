<script lang="ts">
	import { onMount } from 'svelte';
	import type { PlacardDataTable } from '$lib/tableSchema';
	import { generateCompletePDF } from '$lib/placardGeneration';
	import type { Brand } from '$lib/brands';

	interface Props {
		fileData: PlacardDataTable;
		brand: Brand;
	}

	let { fileData, brand }: Props = $props();
	let pdfUrl = $state('');
	let loading = $state(true);

	async function generatePreview() {
		try {
			const pdfBytes = await generateCompletePDF(fileData, brand);
			const blob = new Blob([pdfBytes], { type: 'application/pdf' });
			pdfUrl = URL.createObjectURL(blob);
		} catch (error) {
			console.error('Error generating preview:', error);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		generatePreview();
		return () => {
			if (pdfUrl) URL.revokeObjectURL(pdfUrl);
		};
	});
</script>

<div class="flex w-full flex-col gap-4">
	{#if loading}
		<div class="flex h-[800px] items-center justify-center">
			<span class="loading loading-spinner loading-lg text-primary"></span>
		</div>
	{:else}
		<embed src={pdfUrl} type="application/pdf" class="h-[800px] w-full rounded-lg bg-white" />
	{/if}

	<button
		class="btn btn-primary"
		onclick={() => {
			const link = document.createElement('a');
			link.href = pdfUrl;
			link.download = 'placard.pdf';
			link.click();
		}}
	>
		Download PDF
	</button>
</div>
