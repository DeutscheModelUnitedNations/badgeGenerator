<script lang="ts">
	import Tabs from '$lib/components/Tabs.svelte';
	import Placard from '$lib/components/Placard.svelte';
	import type { PlacardDataTable } from '$lib/tableSchema';
	import type { Brand } from '$lib/brands';

	interface Props {
		fileData: PlacardDataTable;
	}

	let { fileData }: Props = $props();

	const typeTabs = [
		{ title: 'Placard', value: 'PLACARD' },
		{ title: 'Vertical Tag', value: 'VERTICAL_TAG' },
		{ title: 'Horizontal Tag', value: 'HORIZONTAL_TAG' }
	];
	let type = $state('PLACARD');

	const brandingTabs = [
		{ title: 'MUN-SH', value: 'MUN-SH' },
		{ title: 'MUNBW', value: 'MUNBW' }
	];
	let branding = $state<Brand>('MUN-SH');
</script>

<h1 class="text-4xl text-white">Vorschau</h1>
<Tabs tabs={brandingTabs} activeTab={branding} onClick={(value) => (branding = value as Brand)} />
<Tabs tabs={typeTabs} activeTab={type} onClick={(value) => (type = value)} />

<div class="w-full max-w-5xl">
	{#if type === 'PLACARD'}
		<Placard {fileData} brand={branding} />
	{/if}
</div>
