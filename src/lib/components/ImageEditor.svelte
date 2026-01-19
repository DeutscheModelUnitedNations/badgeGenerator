<script lang="ts">
	import type { ImageListItem, ImageEditSettings } from '$lib/types';

	interface Props {
		image: ImageListItem;
		onSave: (settings: ImageEditSettings) => Promise<void>;
		onCancel: () => void;
	}

	let { image, onSave, onCancel }: Props = $props();

	// Edit settings state
	let fitMode = $state<'cover' | 'contain'>('cover');
	let zoom = $state(1.0);
	let offsetX = $state(0);
	let offsetY = $state(0);
	let backgroundColor = $state('#ffffff');

	// UI state
	let isSaving = $state(false);
	let isDragging = $state(false);
	let dragStartX = $state(0);
	let dragStartY = $state(0);
	let dragStartOffsetX = $state(0);
	let dragStartOffsetY = $state(0);

	// Preview container ref
	let previewContainer: HTMLDivElement;

	// Compute preview styles based on settings
	let previewStyle = $derived(() => {
		if (fitMode === 'contain') {
			return {
				objectFit: 'contain' as const,
				objectPosition: 'center',
				transform: 'none',
				backgroundColor
			};
		} else {
			// Cover mode with zoom and offset
			const scale = zoom;
			const translateX = -offsetX * 0.5; // Map percentage to translate
			const translateY = -offsetY * 0.5;
			return {
				objectFit: 'cover' as const,
				objectPosition: 'center',
				transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
				backgroundColor: 'transparent'
			};
		}
	});

	function handleReset() {
		fitMode = 'cover';
		zoom = 1.0;
		offsetX = 0;
		offsetY = 0;
		backgroundColor = '#ffffff';
	}

	async function handleSave() {
		isSaving = true;
		try {
			await onSave({
				fitMode,
				zoom,
				offsetX,
				offsetY,
				backgroundColor
			});
		} finally {
			isSaving = false;
		}
	}

	function handleMouseDown(e: MouseEvent) {
		if (fitMode !== 'cover') return;
		isDragging = true;
		dragStartX = e.clientX;
		dragStartY = e.clientY;
		dragStartOffsetX = offsetX;
		dragStartOffsetY = offsetY;
		e.preventDefault();
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging || fitMode !== 'cover') return;

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
			style="aspect-ratio: 4/3; background-color: {fitMode === 'contain' ? backgroundColor : '#1f2937'};"
		>
			<!-- 4:3 guide overlay -->
			<div class="absolute inset-0 pointer-events-none border-2 border-dashed border-white/30 rounded-lg z-10"></div>

			<!-- Draggable image -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<img
				src={image.url}
				alt={image.title}
				class="w-full h-full {fitMode === 'cover' ? 'cursor-move' : ''}"
				style="object-fit: {previewStyle().objectFit}; object-position: {previewStyle().objectPosition}; transform: {previewStyle().transform};"
				onmousedown={handleMouseDown}
				draggable="false"
			/>

			{#if fitMode === 'cover'}
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
			<!-- Fit mode toggle -->
			<div>
				<label class="text-sm text-base-content/60 block mb-2">Anpassung</label>
				<div class="flex gap-2">
					<label class="flex-1">
						<input
							type="radio"
							name="fitMode"
							value="cover"
							bind:group={fitMode}
							class="hidden peer"
						/>
						<div class="btn btn-sm w-full peer-checked:btn-primary">Füllen</div>
					</label>
					<label class="flex-1">
						<input
							type="radio"
							name="fitMode"
							value="contain"
							bind:group={fitMode}
							class="hidden peer"
						/>
						<div class="btn btn-sm w-full peer-checked:btn-primary">Einpassen</div>
					</label>
				</div>
			</div>

			<!-- Zoom slider (only for cover mode) -->
			{#if fitMode === 'cover'}
				<div>
					<label class="text-sm text-base-content/60 block mb-2">
						Zoom: {Math.round(zoom * 100)}%
					</label>
					<input
						type="range"
						min="0.5"
						max="2"
						step="0.1"
						bind:value={zoom}
						class="range range-primary range-sm w-full"
					/>
					<div class="flex justify-between text-xs text-base-content/50 mt-1">
						<span>50%</span>
						<span>200%</span>
					</div>
				</div>
			{/if}

			<!-- Background color (only for contain mode) -->
			{#if fitMode === 'contain'}
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
			{/if}

			<!-- Reset button -->
			<button class="btn btn-ghost btn-sm w-full" onclick={handleReset}>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
				</svg>
				Zurücksetzen
			</button>
		</div>

		<!-- Action buttons -->
		<div class="mt-6 space-y-2">
			<button class="btn btn-primary btn-block" onclick={handleSave} disabled={isSaving}>
				{#if isSaving}
					<span class="loading loading-spinner loading-sm"></span>
					Speichern...
				{:else}
					Speichern
				{/if}
			</button>
			<button class="btn btn-ghost btn-block" onclick={onCancel} disabled={isSaving}>
				Abbrechen
			</button>
		</div>
	</div>
</div>
