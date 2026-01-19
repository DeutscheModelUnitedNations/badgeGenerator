<script lang="ts">
	import { page } from '$app/stores';
	import type { TableSchema } from '$lib/tableSchema';
	import Preview from './Preview.svelte';
	import Start from './Start.svelte';

	let fileData = $state<TableSchema>();

	const initialParams = $derived({
		name: $page.url.searchParams.get('name') ?? undefined,
		country: $page.url.searchParams.get('country') ?? undefined,
		committee: $page.url.searchParams.get('committee') ?? undefined,
		pronouns: $page.url.searchParams.get('pronouns') ?? undefined,
		id: $page.url.searchParams.get('id') ?? undefined,
		media: $page.url.searchParams.get('media') ?? undefined
	});

	const hasUrlParams = $derived(!!(initialParams.name || initialParams.country));
</script>


	{#if !fileData}
		<Start setFileData={(data) => (fileData = data)} {initialParams} {hasUrlParams} />
	{:else}
		<Preview bind:fileData={fileData}></Preview>
	{/if}
