<script lang="ts">
	import type { ImageListItem } from '$lib/types';

	interface Props {
		image: ImageListItem | null;
		onClose: () => void;
		onRename: (oldTitle: string, newTitle: string) => Promise<void>;
	}

	let { image, onClose, onRename }: Props = $props();

	let newTitle = $state('');
	let isSubmitting = $state(false);
	let error = $state('');

	$effect(() => {
		if (image) {
			newTitle = image.title;
			error = '';
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (!image) return;

		const trimmedTitle = newTitle.trim();

		if (!trimmedTitle) {
			error = 'Der Titel darf nicht leer sein';
			return;
		}

		if (trimmedTitle === image.title) {
			onClose();
			return;
		}

		isSubmitting = true;
		error = '';

		try {
			await onRename(image.title, trimmedTitle);
			onClose();
		} catch (e) {
			if (e instanceof Error) {
				error = e.message;
			} else {
				error = 'Ein Fehler ist aufgetreten';
			}
		} finally {
			isSubmitting = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if image}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div class="bg-base-100 rounded-lg shadow-xl max-w-md w-full p-6">
			<h3 class="text-lg font-semibold mb-4">Bild umbenennen</h3>

			<form onsubmit={handleSubmit}>
				<div class="form-control">
					<label class="label" for="rename-input">
						<span class="label-text">Neuer Name</span>
					</label>
					<input
						id="rename-input"
						type="text"
						class="input input-bordered w-full {error ? 'input-error' : ''}"
						bind:value={newTitle}
						placeholder="Bildname eingeben"
						disabled={isSubmitting}
					/>
					{#if error}
						<label class="label" for="rename-input">
							<span class="label-text-alt text-error">{error}</span>
						</label>
					{/if}
				</div>

				<div class="flex justify-end gap-2 mt-6">
					<button type="button" class="btn btn-ghost" onclick={onClose} disabled={isSubmitting}>
						Abbrechen
					</button>
					<button type="submit" class="btn btn-primary" disabled={isSubmitting}>
						{#if isSubmitting}
							<span class="loading loading-spinner loading-sm"></span>
						{:else}
							<i class="fa-solid fa-check w-4 h-4"></i>
						{/if}
						Speichern
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
