<script lang="ts">
	import type { ImageListItem, ImageEditSettings } from '$lib/types';
	import ImageEditor from './ImageEditor.svelte';

	interface Props {
		image: ImageListItem | null;
		onClose: () => void;
		onEdit?: (image: ImageListItem) => void;
	}

	let { image, onClose, onEdit }: Props = $props();

	let isEditing = $state(false);

	// Reset edit state when modal closes or image changes
	$effect(() => {
		if (!image) {
			isEditing = false;
		}
	});

	async function handleSave(settings: ImageEditSettings) {
		if (!image) return;

		const response = await fetch(`/api/img/${encodeURIComponent(image.title)}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(settings)
		});

		if (!response.ok) {
			const text = await response.text();
			throw new Error(text || 'Bearbeiten fehlgeschlagen');
		}

		const updatedImage: ImageListItem = await response.json();

		isEditing = false;
		onEdit?.(updatedImage);
	}

	function handleCancelEdit() {
		isEditing = false;
	}

	function formatFileSize(bytes?: number): string {
		if (!bytes) return '-';
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function formatDate(dateStr?: string): string {
		if (!dateStr) return '-';
		const date = new Date(dateStr);
		return date.toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
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

{#if image}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div class="relative max-w-5xl w-full max-h-[90vh] flex flex-col md:flex-row bg-base-100 rounded-lg overflow-hidden">
			{#if isEditing}
				<!-- Edit mode -->
				<ImageEditor
					{image}
					onSave={handleSave}
					onCancel={handleCancelEdit}
				/>
			{:else}
				<!-- View mode -->
				<!-- Image container -->
				<div class="flex-1 flex items-center justify-center bg-base-200 p-4 min-h-[300px]">
					<img
						src={image.url}
						alt={image.title}
						class="max-w-full max-h-[70vh] object-contain"
					/>
				</div>

				<!-- Info sidebar -->
				<div class="w-full md:w-72 p-4 border-t md:border-t-0 md:border-l border-base-300">
					<div class="flex justify-between items-start mb-4">
						<h3 class="text-lg font-semibold break-all pr-2">{image.title}</h3>
						<button class="btn btn-ghost btn-sm btn-circle" onclick={onClose} aria-label="Close">
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

					<div class="space-y-3 text-sm">
						<div>
							<p class="text-base-content/60">Dateiformat</p>
							<p class="font-medium uppercase">{image.extension}</p>
						</div>

						{#if image.width && image.height}
							<div>
								<p class="text-base-content/60">Abmessungen</p>
								<p class="font-medium">{image.width} x {image.height} px</p>
							</div>
						{/if}

						{#if image.fileSize}
							<div>
								<p class="text-base-content/60">Dateigröße</p>
								<p class="font-medium">{formatFileSize(image.fileSize)}</p>
							</div>
						{/if}

						{#if image.createdAt}
							<div>
								<p class="text-base-content/60">Hochgeladen am</p>
								<p class="font-medium">{formatDate(image.createdAt)}</p>
							</div>
						{/if}
					</div>

					<div class="mt-6 space-y-2">
						<button class="btn btn-outline btn-block" onclick={() => (isEditing = true)}>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
								/>
							</svg>
							Bearbeiten
						</button>
						<a href={image.url} download="{image.title}.{image.extension}" class="btn btn-primary btn-block">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
								/>
							</svg>
							Herunterladen
						</a>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
