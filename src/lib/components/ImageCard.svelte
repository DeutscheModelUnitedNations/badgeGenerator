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
			src="{image.url}?preview"
			alt={image.title}
			class="w-full h-40 object-cover"
			loading="lazy"
		/>
		<div
			class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-8 w-8 text-white"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
				/>
			</svg>
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
							d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
						/>
					</svg>
				</div>
				<ul class="dropdown-content z-10 menu p-2 shadow bg-base-100 rounded-box w-40">
					<li>
						<button onclick={() => onCopy?.(image.title)}>
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
									d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
								/>
							</svg>
							Kopieren
						</button>
					</li>
					<li>
						<button onclick={handleDownload}>
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
							Download
						</button>
					</li>
					<li>
						<button onclick={() => onRename?.(image)}>
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
							Umbenennen
						</button>
					</li>
					<li>
						<button class="text-error" onclick={() => onDelete?.(image)}>
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
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
							Löschen
						</button>
					</li>
				</ul>
			</div>
		</div>
	</div>
</div>
