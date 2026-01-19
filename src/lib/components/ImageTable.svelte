<script lang="ts">
	import type { ImageListItem } from '$lib/types';

	interface Props {
		images: ImageListItem[];
		onPreview?: (image: ImageListItem) => void;
		onRename?: (image: ImageListItem) => void;
		onDelete?: (image: ImageListItem) => void;
		onCopy?: (title: string) => void;
	}

	let { images, onPreview, onRename, onDelete, onCopy }: Props = $props();

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

	function handleDownload(image: ImageListItem) {
		const a = document.createElement('a');
		a.href = image.url;
		a.download = `${image.title}.${image.extension}`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}
</script>

{#if images.length === 0}
	<div class="text-center py-12 text-base-content/60">
		<p class="text-lg font-medium">Keine Bilder gefunden</p>
	</div>
{:else}
	<div class="overflow-x-auto">
		<table class="table w-full">
			<thead>
				<tr>
					<th class="w-20">Vorschau</th>
					<th>Name</th>
					<th class="hidden sm:table-cell">Typ</th>
					<th class="hidden md:table-cell">Größe</th>
					<th class="hidden lg:table-cell">Datum</th>
					<th class="w-32">Aktionen</th>
				</tr>
			</thead>
			<tbody>
				{#each images as image (image.title)}
					<tr class="hover">
						<td>
							<button
								class="w-16 h-12 overflow-hidden rounded cursor-pointer"
								onclick={() => onPreview?.(image)}
							>
								<img
									src="{image.url}?preview&v={image.fileSize}"
									alt={image.title}
									class="w-full h-full object-cover"
									loading="lazy"
								/>
							</button>
						</td>
						<td>
							<span class="font-medium truncate max-w-xs block" title={image.title}>{image.title}</span>
						</td>
						<td class="hidden sm:table-cell">
							<span class="badge badge-ghost badge-sm uppercase">{image.extension}</span>
						</td>
						<td class="hidden md:table-cell text-base-content/70">
							{formatFileSize(image.fileSize)}
						</td>
						<td class="hidden lg:table-cell text-base-content/70">
							{formatDate(image.createdAt)}
						</td>
						<td>
							<div class="flex gap-1">
								<button
									class="btn btn-ghost btn-xs"
									onclick={() => onCopy?.(image.title)}
									title="Titel kopieren"
								>
									<i class="fa-solid fa-copy w-4 h-4"></i>
								</button>
								<button
									class="btn btn-ghost btn-xs"
									onclick={() => handleDownload(image)}
									title="Herunterladen"
								>
									<i class="fa-solid fa-download w-4 h-4"></i>
								</button>
								<button
									class="btn btn-ghost btn-xs"
									onclick={() => onRename?.(image)}
									title="Umbenennen"
								>
									<i class="fa-solid fa-pen w-4 h-4"></i>
								</button>
								<button
									class="btn btn-ghost btn-xs text-error"
									onclick={() => onDelete?.(image)}
									title="Löschen"
								>
									<i class="fa-solid fa-trash w-4 h-4"></i>
								</button>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
