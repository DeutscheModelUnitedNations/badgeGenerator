<script lang="ts">
	import type { ImageListItem } from '$lib/types';

	interface Props {
		onUpload?: (images: ImageListItem[]) => void;
		accept?: string;
	}

	let { onUpload, accept = '.png,.jpg,.jpeg,.svg' }: Props = $props();

	let isDragging = $state(false);
	let isUploading = $state(false);
	let uploadProgress = $state<{ name: string; progress: number }[]>([]);
	let fileInput: HTMLInputElement;
	let customTitle = $state('');

	function handleDragEnter(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		const files = e.dataTransfer?.files;
		if (files && files.length > 0) {
			processFiles(files);
		}
	}

	function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			processFiles(target.files);
		}
	}

	async function processFiles(files: FileList) {
		isUploading = true;
		uploadProgress = Array.from(files).map((f) => ({ name: f.name, progress: 0 }));
		const uploadedImages: ImageListItem[] = [];

		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			const validExtensions = ['png', 'jpg', 'jpeg', 'svg'];
			const ext = file.name.split('.').pop()?.toLowerCase() || '';

			if (!validExtensions.includes(ext)) {
				uploadProgress[i].progress = -1;
				continue;
			}

			try {
				const title = files.length === 1 && customTitle ? customTitle : file.name.split('.').shift() || file.name;

				const headers = new Headers({
					'X-Image-Title': title,
					'X-Image-Extension': ext,
					'Content-Type': file.type
				});

				uploadProgress[i].progress = 50;

				const response = await fetch('/api/img', {
					method: 'POST',
					headers,
					body: await file.arrayBuffer()
				});

				if (!response.ok) {
					uploadProgress[i].progress = -1;
					continue;
				}

				const imageData: ImageListItem = await response.json();
				uploadedImages.push(imageData);
				uploadProgress[i].progress = 100;
			} catch {
				uploadProgress[i].progress = -1;
			}
		}

		if (uploadedImages.length > 0 && onUpload) {
			onUpload(uploadedImages);
		}

		customTitle = '';
		if (fileInput) fileInput.value = '';

		setTimeout(() => {
			isUploading = false;
			uploadProgress = [];
		}, 1500);
	}
</script>

<div class="w-full max-w-2xl">
	<div class="mb-3">
		<input
			type="text"
			placeholder="Bildname (optional, nur für einzelne Bilder)"
			bind:value={customTitle}
			class="input input-bordered w-full"
		/>
	</div>

	<div
		role="button"
		tabindex="0"
		class="border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
			{isDragging ? 'border-primary bg-primary/10' : 'border-base-300 hover:border-primary/50'}"
		ondragenter={handleDragEnter}
		ondragleave={handleDragLeave}
		ondragover={handleDragOver}
		ondrop={handleDrop}
		onclick={() => fileInput.click()}
		onkeydown={(e) => e.key === 'Enter' && fileInput.click()}
	>
		<input
			type="file"
			{accept}
			multiple
			bind:this={fileInput}
			onchange={handleFileSelect}
			class="hidden"
		/>

		{#if isUploading}
			<div class="space-y-2">
				{#each uploadProgress as item}
					<div class="flex items-center gap-3">
						<span class="text-sm truncate max-w-48">{item.name}</span>
						{#if item.progress === -1}
							<span class="badge badge-error badge-sm">Fehler</span>
						{:else if item.progress === 100}
							<span class="badge badge-success badge-sm">Fertig</span>
						{:else}
							<progress class="progress progress-primary w-24" value={item.progress} max="100"
							></progress>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<div class="flex flex-col items-center gap-2">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-12 w-12 text-base-content/50"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
					/>
				</svg>
				<p class="font-medium">
					{isDragging ? 'Dateien hier ablegen' : 'Bilder hierher ziehen oder klicken'}
				</p>
				<p class="text-sm text-base-content/60">PNG, JPG, JPEG, SVG (max. 10MB)</p>
			</div>
		{/if}
	</div>
</div>
