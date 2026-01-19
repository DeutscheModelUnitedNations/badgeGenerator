<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	let imgInput: HTMLInputElement;
	let imgFiles: FileList;
	let imgTitle = '';

	async function uploadImage(file: File) {
		if (file.name.split('.').length !== 2) {
			alert('Invalid file name (contains too many dots or extension is missing)');
			return;
		}

		try {
			const headers = new Headers({
				'X-Image-Title': imgTitle ? imgTitle : file.name.split('.').shift() || '',
				'X-Image-Extension': file.name.split('.').pop() || '',
				'Content-Type': file.type
			});

			const response = await fetch('/api/img', {
				method: 'POST',
				headers,
				body: await file.arrayBuffer()
			});

			if (!response.ok) {
				alert('Upload failed: ' + response.statusText);
				return null;
			}

			const location = response.headers.get('Location');
			if (location) {
				alert('Image uploaded successfully');
			} else {
				alert('Upload failed: No location returned');
			}

			await invalidateAll();
			return location;
		} catch (error) {
			alert('An error occurred during upload');
			return null;
		}
	}
</script>

<input
	type="file"
	accept=".png, .jpg, .jpeg, .svg"
	bind:files={imgFiles}
	bind:this={imgInput}
	onchange={() => imgFiles && uploadImage(imgFiles[0])}
	class="hidden"
	id="imgInput"
/>
<div class="join join-vertical w-full max-w-lg">
	<input
		type="text"
		placeholder="Bildname (optional, Dateiendung wird automatisch ergänzt)"
		bind:value={imgTitle}
		class="input join-item input-primary"
	/>
	<button class="btn btn-primary join-item" onclick={() => imgInput.click()}>Bild hochladen</button>
</div>
