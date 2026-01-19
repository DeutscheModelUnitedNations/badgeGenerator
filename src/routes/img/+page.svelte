<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import type { ImageListItem } from '$lib/types';
	import DropZone from '$lib/components/DropZone.svelte';
	import ImageGrid from '$lib/components/ImageGrid.svelte';
	import ImageTable from '$lib/components/ImageTable.svelte';
	import ImagePreviewModal from '$lib/components/ImagePreviewModal.svelte';
	import RenameModal from '$lib/components/RenameModal.svelte';

	let { data }: { data: PageData } = $props();

	// View state
	let viewMode = $state<'grid' | 'table'>('grid');
	let searchQuery = $state('');
	let sortField = $state(data.sort);
	let sortOrder = $state(data.order);

	// Modal state
	let previewImage = $state<ImageListItem | null>(null);
	let renameImage = $state<ImageListItem | null>(null);
	let deleteConfirmImage = $state<ImageListItem | null>(null);

	// Toast notification
	let toastMessage = $state('');
	let toastType = $state<'success' | 'error'>('success');

	// Filtered images based on search
	let filteredImages = $derived(
		data.images.filter((img) => img.title.toLowerCase().includes(searchQuery.toLowerCase()))
	);

	// Persist view mode preference
	$effect(() => {
		const saved = localStorage.getItem('imageViewMode');
		if (saved === 'grid' || saved === 'table') {
			viewMode = saved;
		}
	});

	function setViewMode(mode: 'grid' | 'table') {
		viewMode = mode;
		localStorage.setItem('imageViewMode', mode);
	}

	function showToast(message: string, type: 'success' | 'error' = 'success') {
		toastMessage = message;
		toastType = type;
		setTimeout(() => {
			toastMessage = '';
		}, 3000);
	}

	function handleSort(field: string) {
		if (sortField === field) {
			sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
		} else {
			sortField = field;
			sortOrder = 'asc';
		}
		goto(`?sort=${sortField}&order=${sortOrder}`, { replaceState: true });
	}

	async function handleUpload(images: ImageListItem[]) {
		await invalidateAll();
		showToast(
			images.length === 1
				? `"${images[0].title}" wurde hochgeladen`
				: `${images.length} Bilder wurden hochgeladen`
		);
	}

	function handleCopy(title: string) {
		navigator.clipboard.writeText(title).then(() => {
			showToast(`"${title}" kopiert`);
		}).catch(() => {
			showToast('Kopieren fehlgeschlagen', 'error');
		});
	}

	function handlePreview(image: ImageListItem) {
		previewImage = image;
	}

	function handleRenameClick(image: ImageListItem) {
		renameImage = image;
	}

	async function handleRename(oldTitle: string, newTitle: string) {
		const response = await fetch(`/api/img/${encodeURIComponent(oldTitle)}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title: newTitle })
		});

		if (!response.ok) {
			const text = await response.text();
			throw new Error(text || 'Umbenennen fehlgeschlagen');
		}

		await invalidateAll();
		showToast(`Bild wurde zu "${newTitle}" umbenannt`);
	}

	function handleDeleteClick(image: ImageListItem) {
		deleteConfirmImage = image;
	}

	async function handleEdit(updatedImage: ImageListItem) {
		await invalidateAll();
		previewImage = updatedImage;
		showToast(`"${updatedImage.title}" wurde bearbeitet`);
	}

	async function confirmDelete() {
		if (!deleteConfirmImage) return;

		const title = deleteConfirmImage.title;

		try {
			const response = await fetch(`/api/img/${encodeURIComponent(title)}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				throw new Error('Löschen fehlgeschlagen');
			}

			await invalidateAll();
			showToast(`"${title}" wurde gelöscht`);
		} catch {
			showToast('Löschen fehlgeschlagen', 'error');
		} finally {
			deleteConfirmImage = null;
		}
	}
</script>

<svelte:head>
	<title>Bilderliste</title>
</svelte:head>

<div class="container mx-auto px-4 py-6 max-w-6xl">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
		<div class="flex items-center gap-3">
			<a href="/" class="btn btn-ghost btn-sm" aria-label="Zurück zur Startseite">
				<i class="fa-solid fa-arrow-left w-5 h-5"></i>
			</a>
			<h1 class="text-2xl font-bold">Bilderliste</h1>
			<span class="badge badge-ghost">{data.images.length}</span>
		</div>
	</div>

	<!-- Info alert -->
	<div class="alert mb-6">
		<i class="fa-solid fa-circle-info w-5 h-5 shrink-0"></i>
		<div>
			<p>
				Nutze den Bildnamen in der Spalte <strong>"alternativeImage"</strong> deiner Datentabelle (ohne
				Dateiendung).
			</p>
			<p class="text-sm opacity-70 mt-1">
				Unterstützte Formate: PNG, JPG, JPEG, SVG. Bilder werden auf 1200x900px (4:3) zugeschnitten.
			</p>
		</div>
	</div>

	<!-- Upload area -->
	<div class="flex justify-center mb-8">
		<DropZone onUpload={handleUpload} />
	</div>

	<div class="divider"></div>

	<!-- Toolbar -->
	<div class="flex flex-col sm:flex-row gap-3 mb-6">
		<!-- Search -->
		<div class="flex-1">
			<input
				type="text"
				placeholder="Bilder suchen..."
				class="input input-bordered w-full max-w-sm"
				bind:value={searchQuery}
			/>
		</div>

		<!-- Sort dropdown -->
		<div class="dropdown dropdown-end">
			<div tabindex="0" role="button" class="btn btn-ghost gap-2">
				<i class="fa-solid fa-arrow-up-wide-short w-4 h-4"></i>
				Sortieren
			</div>
			<ul class="dropdown-content z-10 menu p-2 shadow bg-base-100 rounded-box w-52">
				<li>
					<button class:active={sortField === 'title'} onclick={() => handleSort('title')}>
						Name {sortField === 'title' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
					</button>
				</li>
				<li>
					<button class:active={sortField === 'createdAt'} onclick={() => handleSort('createdAt')}>
						Datum {sortField === 'createdAt' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
					</button>
				</li>
				<li>
					<button class:active={sortField === 'extension'} onclick={() => handleSort('extension')}>
						Typ {sortField === 'extension' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
					</button>
				</li>
				<li>
					<button class:active={sortField === 'fileSize'} onclick={() => handleSort('fileSize')}>
						Größe {sortField === 'fileSize' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
					</button>
				</li>
			</ul>
		</div>

		<!-- View toggle -->
		<div class="join">
			<button
				class="btn btn-sm join-item {viewMode === 'grid' ? 'btn-active' : ''}"
				onclick={() => setViewMode('grid')}
				title="Rasteransicht"
			>
				<i class="fa-solid fa-grid-2 w-4 h-4"></i>
			</button>
			<button
				class="btn btn-sm join-item {viewMode === 'table' ? 'btn-active' : ''}"
				onclick={() => setViewMode('table')}
				title="Listenansicht"
			>
				<i class="fa-solid fa-list w-4 h-4"></i>
			</button>
		</div>
	</div>

	<!-- Search result info -->
	{#if searchQuery && filteredImages.length !== data.images.length}
		<p class="text-sm text-base-content/60 mb-4">
			{filteredImages.length} von {data.images.length} Bildern
		</p>
	{/if}

	<!-- Image display -->
	{#if viewMode === 'grid'}
		<ImageGrid
			images={filteredImages}
			onPreview={handlePreview}
			onRename={handleRenameClick}
			onDelete={handleDeleteClick}
			onCopy={handleCopy}
		/>
	{:else}
		<ImageTable
			images={filteredImages}
			onPreview={handlePreview}
			onRename={handleRenameClick}
			onDelete={handleDeleteClick}
			onCopy={handleCopy}
		/>
	{/if}
</div>

<!-- Preview Modal -->
<ImagePreviewModal image={previewImage} onClose={() => (previewImage = null)} onEdit={handleEdit} />

<!-- Rename Modal -->
<RenameModal image={renameImage} onClose={() => (renameImage = null)} onRename={handleRename} />

<!-- Delete Confirmation Modal -->
{#if deleteConfirmImage}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
		onclick={(e) => e.target === e.currentTarget && (deleteConfirmImage = null)}
		onkeydown={(e) => e.key === 'Escape' && (deleteConfirmImage = null)}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div class="bg-base-100 rounded-lg shadow-xl max-w-sm w-full p-6">
			<h3 class="text-lg font-semibold mb-2">Bild löschen?</h3>
			<p class="text-base-content/70 mb-4">
				Möchtest du <strong>"{deleteConfirmImage.title}"</strong> wirklich löschen? Diese Aktion kann
				nicht rückgängig gemacht werden.
			</p>
			<div class="flex justify-end gap-2">
				<button class="btn btn-ghost" onclick={() => (deleteConfirmImage = null)}>Abbrechen</button>
				<button class="btn btn-error" onclick={confirmDelete}>Löschen</button>
			</div>
		</div>
	</div>
{/if}

<!-- Toast notifications -->
{#if toastMessage}
	<div class="toast toast-end toast-bottom">
		<div class="alert {toastType === 'success' ? 'alert-success' : 'alert-error'}">
			<span>{toastMessage}</span>
		</div>
	</div>
{/if}
