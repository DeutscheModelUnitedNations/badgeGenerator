<script lang="ts">
	import WorldCountries from 'world-countries';

	interface Props {
		onSelect: (code: string, name: string) => void;
		onClose: () => void;
	}

	let { onSelect, onClose }: Props = $props();

	let searchQuery = $state('');

	// Country options including UN
	const countryOptions = [
		{ name: 'Vereinte Nationen (UN)', code: 'UN' },
		...WorldCountries.map((c) => ({
			name: c.translations.deu?.common ?? c.name.common,
			code: c.cca2
		})).sort((a, b) => a.name.localeCompare(b.name, 'de'))
	];

	// Filtered countries based on search
	let filteredCountries = $derived(
		searchQuery.trim()
			? countryOptions.filter((country) =>
					country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					country.code.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: countryOptions
	);

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

	function getFlagUrl(code: string): string {
		if (code === 'UN') {
			return '/flags/un.png';
		}
		return `/flags/${code.toLowerCase()}.png`;
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
	onclick={handleBackdropClick}
	onkeydown={handleKeydown}
	role="dialog"
	aria-modal="true"
	tabindex="-1"
>
	<div class="bg-base-100 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
		<!-- Header -->
		<div class="p-4 border-b border-base-300 flex justify-between items-center">
			<h3 class="text-lg font-semibold">Land auswählen</h3>
			<button class="btn btn-ghost btn-sm btn-circle" onclick={onClose} aria-label="Schließen">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>

		<!-- Search input -->
		<div class="p-4 border-b border-base-300">
			<input
				type="text"
				class="input input-bordered w-full"
				placeholder="Land suchen..."
				bind:value={searchQuery}
			/>
		</div>

		<!-- Content -->
		<div class="flex-1 overflow-y-auto p-4">
			{#if filteredCountries.length === 0}
				<div class="text-center py-8 text-base-content/60">
					<p>Keine Länder gefunden.</p>
				</div>
			{:else}
				<div class="grid grid-cols-3 sm:grid-cols-4 gap-3">
					{#each filteredCountries as country}
						<button
							type="button"
							class="group relative aspect-[4/3] bg-base-200 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary focus:ring-2 focus:ring-primary transition-all"
							onclick={() => onSelect(country.code, country.name)}
						>
							<img
								src={getFlagUrl(country.code)}
								alt={country.name}
								class="w-full h-full object-cover"
							/>
							<div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
								<p class="text-white text-xs truncate">{country.name}</p>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
