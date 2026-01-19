<script lang="ts">
	import type { ImageListItem } from '$lib/types';
	import ImageCard from './ImageCard.svelte';

	interface Props {
		images: ImageListItem[];
		onPreview?: (image: ImageListItem) => void;
		onRename?: (image: ImageListItem) => void;
		onDelete?: (image: ImageListItem) => void;
		onCopy?: (title: string) => void;
	}

	let { images, onPreview, onRename, onDelete, onCopy }: Props = $props();
</script>

{#if images.length === 0}
	<div class="text-center py-12 text-base-content/60">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-16 w-16 mx-auto mb-4 opacity-50"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
			/>
		</svg>
		<p class="text-lg font-medium">Keine Bilder gefunden</p>
		<p class="text-sm mt-1">Lade dein erstes Bild hoch, um loszulegen</p>
	</div>
{:else}
	<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
		{#each images as image (image.title)}
			<ImageCard {image} {onPreview} {onRename} {onDelete} {onCopy} />
		{/each}
	</div>
{/if}
