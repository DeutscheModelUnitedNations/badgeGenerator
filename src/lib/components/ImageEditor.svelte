<script lang="ts">
	import type { ImageListItem, ImageEditSettings } from '$lib/types';

	interface Props {
		image: ImageListItem;
		onSave: (settings: ImageEditSettings) => Promise<void>;
		onCancel: () => void;
	}

	let { image, onSave, onCancel }: Props = $props();

	// Edit settings state
	let zoom = $state(1.0);
	let offsetX = $state(0);
	let offsetY = $state(0);
	let backgroundColor = $state('#ffffff');

	// UI state
	let isSaving = $state(false);
	let errorMessage = $state('');
	let isDragging = $state(false);
	let dragStartX = $state(0);
	let dragStartY = $state(0);
	let dragStartOffsetX = $state(0);
	let dragStartOffsetY = $state(0);

	// Preview container ref
	let previewContainer: HTMLDivElement;

	// Add cache-busting to image URL
	let imageUrl = $derived(
		image.url.includes('?') ? `${image.url}&editor=1` : `${image.url}?editor=${Date.now()}`
	);

	// Can only pan when zoomed in (zoom > 1)
	let canPan = $derived(zoom > 1);

	// Compute preview styles based on settings
	let previewStyle = $derived(() => {
		if (zoom < 1) {
			// Zoom < 100%: Show image smaller with padding
			const scale = zoom;
			return {
				objectFit: 'contain' as const,
				objectPosition: 'center',
				transform: `scale(${scale})`,
				width: '100%',
				height: '100%'
			};
		} else {
			// Zoom >= 100%: Cover mode with crop/pan
			const scale = zoom;
			const translateX = -offsetX * 0.5; // Map percentage to translate
			const translateY = -offsetY * 0.5;
			return {
				objectFit: 'cover' as const,
				objectPosition: 'center',
				transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
				width: '100%',
				height: '100%'
			};
		}
	});

	function handleReset() {
		zoom = 1.0;
		offsetX = 0;
		offsetY = 0;
		backgroundColor = '#ffffff';
	}

	async function handleSave() {
		isSaving = true;
		errorMessage = '';
		try {
			await onSave({
				fitMode: zoom < 1 ? 'contain' : 'cover', // Determined by zoom level
				zoom,
				offsetX,
				offsetY,
				backgroundColor
			});
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Speichern fehlgeschlagen';
			console.error('Save error:', err);
		} finally {
			isSaving = false;
		}
	}

	function handleMouseDown(e: MouseEvent) {
		if (!canPan) return;
		isDragging = true;
		dragStartX = e.clientX;
		dragStartY = e.clientY;
		dragStartOffsetX = offsetX;
		dragStartOffsetY = offsetY;
		e.preventDefault();
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging || !canPan) return;

		const deltaX = e.clientX - dragStartX;
		const deltaY = e.clientY - dragStartY;

		// Sensitivity factor - adjust based on container size and zoom
		const sensitivity = 0.5 / zoom;

		// Update offsets (inverted because dragging moves the viewport, not the image)
		offsetX = Math.max(-100, Math.min(100, dragStartOffsetX - deltaX * sensitivity));
		offsetY = Math.max(-100, Math.min(100, dragStartOffsetY - deltaY * sensitivity));
	}

	function handleMouseUp() {
		isDragging = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onCancel();
		}
	}
</script>

<svelte:window onmousemove={handleMouseMove} onmouseup={handleMouseUp} onkeydown={handleKeydown} />

<div class="flex flex-col md:flex-row h-full">
	<!-- Preview container with 4:3 aspect ratio -->
	<div class="flex-1 flex items-center justify-center bg-base-200 p-4 min-h-[300px]">
		<div
			bind:this={previewContainer}
			class="relative w-full max-w-lg overflow-hidden rounded-lg shadow-lg"
			style="aspect-ratio: 4/3; background-color: {backgroundColor};"
		>
			<!-- 4:3 guide overlay -->
			<div class="absolute inset-0 pointer-events-none border-2 border-dashed border-white/30 rounded-lg z-10"></div>

			<!-- Draggable image -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<img
				src={imageUrl}
				alt={image.title}
				class="w-full h-full {canPan ? 'cursor-move' : ''}"
				style="object-fit: {previewStyle().objectFit}; object-position: {previewStyle().objectPosition}; transform: {previewStyle().transform};"
				onmousedown={handleMouseDown}
				draggable="false"
			/>

			{#if canPan}
				<div class="absolute bottom-2 left-2 text-xs text-white/70 bg-black/50 px-2 py-1 rounded z-20">
					Zum Verschieben ziehen
				</div>
			{/if}
		</div>
	</div>

	<!-- Controls sidebar -->
	<div class="w-full md:w-72 p-4 border-t md:border-t-0 md:border-l border-base-300">
		<h3 class="text-lg font-semibold mb-4">Bild bearbeiten</h3>

		<div class="space-y-5">
			<!-- Zoom slider -->
			<div>
				<label class="text-sm text-base-content/60 block mb-2">
					Zoom: {Math.round(zoom * 100)}%
				</label>
				<input
					type="range"
					min="0.5"
					max="2"
					step="0.05"
					bind:value={zoom}
					class="range range-primary range-sm w-full"
				/>
				<div class="flex justify-between text-xs text-base-content/50 mt-1">
					<span>50%</span>
					<span>100%</span>
					<span>200%</span>
				</div>
				{#if zoom < 1}
					<p class="text-xs text-base-content/50 mt-2">
						Bild wird mit Rand dargestellt
					</p>
				{:else if zoom > 1}
					<p class="text-xs text-base-content/50 mt-2">
						Bild wird beschnitten (ziehen zum Verschieben)
					</p>
				{/if}
			</div>

			<!-- Background color -->
			<div>
				<label class="text-sm text-base-content/60 block mb-2">Hintergrundfarbe</label>
				<div class="flex items-center gap-2">
					<input
						type="color"
						bind:value={backgroundColor}
						class="w-10 h-10 rounded cursor-pointer border border-base-300"
					/>
					<input
						type="text"
						bind:value={backgroundColor}
						class="input input-bordered input-sm flex-1 font-mono uppercase"
						pattern="^#[0-9A-Fa-f]{6}$"
					/>
				</div>
				<!-- Quick color presets -->
				<div class="flex gap-1 mt-2">
					{#each ['#ffffff', '#000000', '#1f2937', '#f3f4f6'] as color}
						<button
							class="w-6 h-6 rounded border border-base-300"
							style="background-color: {color};"
							onclick={() => (backgroundColor = color)}
							title={color}
						></button>
					{/each}
				</div>
			</div>

			<!-- Reset button -->
			<button class="btn btn-ghost btn-sm w-full" onclick={handleReset}>
				<i class="fa-solid fa-rotate-left w-4 h-4"></i>
				Zurücksetzen
			</button>
		</div>

		<!-- Error message -->
		{#if errorMessage}
			<div class="alert alert-error text-sm">
				<i class="fa-solid fa-circle-exclamation w-4 h-4 shrink-0"></i>
				<span>{errorMessage}</span>
			</div>
		{/if}

		<!-- Action buttons -->
		<div class="mt-6 space-y-2">
			<button class="btn btn-primary btn-block" onclick={handleSave} disabled={isSaving}>
				{#if isSaving}
					<span class="loading loading-spinner loading-sm"></span>
					Speichern...
				{:else}
					<i class="fa-solid fa-floppy-disk w-4 h-4"></i>
					Speichern
				{/if}
			</button>
			<button class="btn btn-ghost btn-block" onclick={onCancel} disabled={isSaving}>
				<i class="fa-solid fa-xmark w-4 h-4"></i>
				Abbrechen
			</button>
		</div>
	</div>
</div>
