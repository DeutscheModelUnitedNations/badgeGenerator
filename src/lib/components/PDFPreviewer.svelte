<script lang="ts">
	interface Props {
		fileData: any;
		brand: any;
		generatePDF: (fileData: any, brand: any) => Promise<Uint8Array>;
		schema: any;
		downloadFilename: string;
	}
	const { fileData, brand, generatePDF, schema, downloadFilename }: Props = $props();

	let validationFailed = $state(false);
	let pdfUrl = $state('');
	let loading = $state(true);

	async function generatePreview() {
		try {
			const pdfBytes = await generatePDF(fileData, brand);
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
		const { success } = schema.safeParse(fileData);
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
		<div class="alert alert-error">Data is invalid. Please check the input file.</div>
	{:else if loading}
		<div class="flex justify-center">
			<span class="loading loading-dots loading-lg text-primary"></span>
		</div>
	{:else}
		<embed src={pdfUrl} type="application/pdf" class=" h-[80vh] w-full rounded-lg bg-white" />
		<button
			class="btn btn-primary"
			onclick={() => {
				const link = document.createElement('a');
				link.href = pdfUrl;
				link.download = downloadFilename;
				link.click();
			}}
		>
			Download PDF
		</button>
	{/if}
</div>
