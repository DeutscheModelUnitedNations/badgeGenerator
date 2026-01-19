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
									src="{image.url}?preview"
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
								</button>
								<button
									class="btn btn-ghost btn-xs"
									onclick={() => handleDownload(image)}
									title="Herunterladen"
								>
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
								</button>
								<button
									class="btn btn-ghost btn-xs"
									onclick={() => onRename?.(image)}
									title="Umbenennen"
								>
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
								</button>
								<button
									class="btn btn-ghost btn-xs text-error"
									onclick={() => onDelete?.(image)}
									title="Löschen"
								>
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
								</button>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
