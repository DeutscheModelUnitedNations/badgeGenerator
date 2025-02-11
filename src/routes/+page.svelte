<script lang="ts">
	import type { TableSchema } from '$lib/tableSchema';
	import Preview from './Preview.svelte';
	import Start from './Start.svelte';

	let fileData = $state<TableSchema>();
</script>


	{#if !fileData}
		<Start setFileData={(data) => (fileData = data)} />
	{:else}
		<Preview bind:fileData={fileData}></Preview>
	{/if}
