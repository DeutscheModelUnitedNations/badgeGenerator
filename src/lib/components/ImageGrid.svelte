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
		<i class="fa-solid fa-image fa-3x mb-4 opacity-50"></i>
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
