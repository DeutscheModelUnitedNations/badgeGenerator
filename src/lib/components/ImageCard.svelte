<script lang="ts">
	import type { ImageListItem } from '$lib/types';

	interface Props {
		image: ImageListItem;
		onPreview?: (image: ImageListItem) => void;
		onRename?: (image: ImageListItem) => void;
		onDelete?: (image: ImageListItem) => void;
		onCopy?: (title: string) => void;
	}

	let { image, onPreview, onRename, onDelete, onCopy }: Props = $props();

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
			year: 'numeric'
		});
	}

	function handleDownload() {
		const a = document.createElement('a');
		a.href = image.url;
		a.download = `${image.title}.${image.extension}`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}
</script>

<div class="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
	<button
		type="button"
		class="relative group cursor-pointer w-full"
		onclick={() => onPreview?.(image)}
		aria-label="Vorschau für {image.title}"
	>
		<img
			src="{image.url}?preview&v={image.fileSize}"
			alt={image.title}
			class="w-full h-40 object-cover"
			loading="lazy"
		/>
		<div
			class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
		>
			<i class="fa-solid fa-magnifying-glass-plus text-white text-3xl"></i>
		</div>
	</button>

	<div class="card-body p-3">
		<h3 class="card-title text-sm truncate" title={image.title}>{image.title}</h3>

		<div class="flex flex-wrap gap-1 text-xs text-base-content/60">
			<span class="badge badge-sm badge-ghost">.{image.extension}</span>
			{#if image.width && image.height}
				<span class="badge badge-sm badge-ghost">{image.width}x{image.height}</span>
			{/if}
			{#if image.fileSize}
				<span class="badge badge-sm badge-ghost">{formatFileSize(image.fileSize)}</span>
			{/if}
		</div>

		{#if image.createdAt}
			<p class="text-xs text-base-content/50">{formatDate(image.createdAt)}</p>
		{/if}

		<div class="card-actions justify-end mt-2">
			<div class="dropdown dropdown-end">
				<div tabindex="0" role="button" class="btn btn-ghost btn-xs">
					<i class="fa-solid fa-ellipsis-vertical w-4 h-4"></i>
				</div>
				<ul class="dropdown-content z-10 menu p-2 shadow bg-base-100 rounded-box w-40">
					<li>
						<button onclick={() => onCopy?.(image.title)}>
							<i class="fa-solid fa-copy w-4 h-4"></i>
							Kopieren
						</button>
					</li>
					<li>
						<button onclick={handleDownload}>
							<i class="fa-solid fa-download w-4 h-4"></i>
							Download
						</button>
					</li>
					<li>
						<button onclick={() => onRename?.(image)}>
							<i class="fa-solid fa-pen w-4 h-4"></i>
							Umbenennen
						</button>
					</li>
					<li>
						<button class="text-error" onclick={() => onDelete?.(image)}>
							<i class="fa-solid fa-trash w-4 h-4"></i>
							Löschen
						</button>
					</li>
				</ul>
			</div>
		</div>
	</div>
</div>
