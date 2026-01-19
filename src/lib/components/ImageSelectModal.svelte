<script lang="ts">
	import type { ImageListItem } from '$lib/types';

	interface Props {
		onSelect: (title: string) => void;
		onClose: () => void;
	}

	let { onSelect, onClose }: Props = $props();

	let images = $state<ImageListItem[]>([]);
	let isLoading = $state(true);
	let error = $state('');
	let searchQuery = $state('');

	// Filtered images based on search
	let filteredImages = $derived(
		searchQuery.trim()
			? images.filter((img) =>
					img.title.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: images
	);

	// Fetch images on mount
	$effect(() => {
		fetchImages();
	});

	async function fetchImages() {
		isLoading = true;
		error = '';

		try {
			const response = await fetch('/api/img');
			if (!response.ok) {
				throw new Error('Fehler beim Laden der Bilder');
			}
			images = await response.json();
		} catch (e) {
			if (e instanceof Error) {
				error = e.message;
			} else {
				error = 'Ein Fehler ist aufgetreten';
			}
		} finally {
			isLoading = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
	onclick={handleBackdropClick}
	onkeydown={handleKeydown}
	role="dialog"
	aria-modal="true"
	tabindex="-1"
>
	<div class="bg-base-100 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
		<!-- Header -->
		<div class="p-4 border-b border-base-300 flex justify-between items-center">
			<h3 class="text-lg font-semibold">Bild auswählen</h3>
			<button class="btn btn-ghost btn-sm btn-circle" onclick={onClose} aria-label="Schließen">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>

		<!-- Search input -->
		<div class="p-4 border-b border-base-300">
			<input
				type="text"
				class="input input-bordered w-full"
				placeholder="Bild suchen..."
				bind:value={searchQuery}
			/>
		</div>

		<!-- Content -->
		<div class="flex-1 overflow-y-auto p-4">
			{#if isLoading}
				<div class="flex justify-center items-center py-8">
					<span class="loading loading-spinner loading-lg"></span>
				</div>
			{:else if error}
				<div class="alert alert-error">
					<span>{error}</span>
				</div>
			{:else if images.length === 0}
				<div class="text-center py-8 text-base-content/60">
					<p>Keine Bilder vorhanden.</p>
					<p class="text-sm mt-2">Lade Bilder in der Bilderliste hoch.</p>
				</div>
			{:else if filteredImages.length === 0}
				<div class="text-center py-8 text-base-content/60">
					<p>Keine Bilder gefunden.</p>
				</div>
			{:else}
				<div class="grid grid-cols-3 sm:grid-cols-4 gap-3">
					{#each filteredImages as image}
						<button
							type="button"
							class="group relative aspect-[4/3] bg-base-200 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary focus:ring-2 focus:ring-primary transition-all"
							onclick={() => onSelect(image.title)}
						>
							<img
								src="/api/img/{encodeURIComponent(image.title)}?preview"
								alt={image.title}
								class="w-full h-full object-cover"
							/>
							<div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
								<p class="text-white text-xs truncate">{image.title}</p>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
