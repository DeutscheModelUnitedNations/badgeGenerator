<script lang="ts">
	import ImageUploader from '$lib/components/ImageUploader.svelte';
	import { type PageData } from './$types';
	import { invalidateAll } from '$app/navigation';

	let { data }: { data: PageData } = $props();
	let images = $derived(data.images);

	function copyToClipboard(title: string) {
		navigator.clipboard.writeText(title).catch((err) => {
			console.error('Error copying URL: ', err);
		});
	}

	async function deleteImage(image: (typeof images)[0]) {
		if (!confirm('Möchten Sie dieses Bild wirklich löschen?')) return;

		fetch(`/api/img/${image.title}`, { method: 'DELETE' })
			.then((res) => {
				if (!res.ok) throw new Error('Failed to delete image');
			})
			.catch((err) => {
				console.error('Error deleting image: ', err);
				alert('Fehler beim Löschen des Bildes');
			});

		await invalidateAll();
	}
</script>

<a href="/" class="btn btn-ghost">Zurück</a>
<h1 class="text-4xl">Bilderliste</h1>
<div class="alert w-full max-w-2xl text-center">
	<div class="flex flex-col gap-4">
		<p>
			Nutze den untenstehenden Uploader, um Bilder hochzuladen. Du kannst sie in der Datentabelle
			referenzieren, indem du in der Spalte "alternativeImage" den Namen angibts (ohne Dateiendung).
		</p>
		<p>
			Es können nur Bilder im Format <strong>.jpg, .jpeg und .png</strong> hochgeladen werden und
			müssen im <strong>Format 4x3</strong> sein!
		</p>
	</div>
</div>

<ImageUploader />

{#if images.length === 0}
	<p class="text-center">Noch keine Bilder vorhanden</p>
{:else}
	<div class="divider mx-auto w-full max-w-2xl"></div>

	<table class="table w-full max-w-2xl">
		<thead>
			<tr>
				<th class="w-full">Name</th>
				<th>Vorschau</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each images as image}
				<tr class="transition-all duration-200 hover:bg-gray-100">
					<td>{image.title}</td>
					<td>
						<img src={`${image.url}?preview`} alt={image.title} />
					</td>
					<td class="flex gap-2">
						<button class="btn btn-primary btn-sm" onclick={() => copyToClipboard(image.title)}
							>Kopieren</button
						>
						<button class="btn btn-error btn-sm" onclick={() => deleteImage(image)}>Löschen</button>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}
