<script lang="ts">
	import Tabs from '$lib/components/Tabs.svelte';
	import Placard from '$lib/components/Placard.svelte';
	import type { PlacardDataTable } from '$lib/tableSchema';
	import type { Brand } from '$lib/brands';
	import VerticalBadge from '$lib/components/VerticalBadge.svelte';
	import HorizontalBadge from '$lib/components/HorizontalBadge.svelte';

	interface Props {
		fileData: PlacardDataTable | undefined;
	}

	let { fileData = $bindable() }: Props = $props();

	const typeTabs = [
		{ title: 'Länderschild', value: 'PLACARD' },
		{ title: 'Namensschild Hochkant', value: 'VERTICAL_BADGE' },
		{ title: 'Namensschild Quer', value: 'HORIZONTAL_BADGE' }
	] as const;
	let type = $state<'PLACARD' | 'VERTICAL_BADGE' | 'HORIZONTAL_BADGE'>('VERTICAL_BADGE');

	const brandingTabs = [
		{ title: 'MUN-SH', value: 'MUN-SH' },
		{ title: 'MUNBW', value: 'MUNBW' }
	] as const;
	let branding = $state<Brand>('MUN-SH');
</script>

<button class="btn btn-ghost" onclick={() => (fileData = undefined)}>Generator</button>
<h1 class="text-4xl">Vorschau</h1>
<Tabs tabs={typeTabs} bind:activeTab={type} />
<Tabs tabs={brandingTabs} bind:activeTab={branding} />

<div class="w-full max-w-5xl">
	{#if type === 'PLACARD'}
		<Placard fileData={fileData!} brand={branding} />
	{:else if type === 'VERTICAL_BADGE'}
		<VerticalBadge fileData={fileData!} brand={branding} />
	{:else if type === 'HORIZONTAL_BADGE'}
		<HorizontalBadge fileData={fileData!} brand={branding} />
	{/if}
</div>
