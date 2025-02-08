<script lang="ts">
	import { badgeSchema, placardSchema, type BadgeDataTable } from '$lib/tableSchema';
	import { generateCompletePDF } from '$lib/verticalBadgeGeneration';
	import type { Brand } from '$lib/brands';

	interface Props {
		fileData: BadgeDataTable;
		brand: Brand;
	}

	let { fileData, brand }: Props = $props();
	let validationFailed = $state(false);
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

	$effect(() => {
		loading = true;
		const { success } = badgeSchema.safeParse(fileData);
		if (!success) {
			validationFailed = true;
			return;
		}

		generatePreview();
		return () => {
			if (pdfUrl) URL.revokeObjectURL(pdfUrl);
		};
	});
</script>

<div class="flex w-full flex-col gap-4">
	{#if validationFailed}
		<div class="alert alert-error">
			Die bereitgestellten Daten sind für diesen Typ ungültig. Bitte wählen Sie den entsprechenden Typ aus und überprüfen Sie die Eingabedatei.
		</div>
	{:else}
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
				link.download = 'vertical-badges.pdf';
				link.click();
			}}
		>
			Download PDF
		</button>
	{/if}
</div>
