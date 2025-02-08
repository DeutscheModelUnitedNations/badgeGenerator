<script lang="ts">
	import type { PlacardDataTable } from '$lib/tableSchema';
	import Preview from './Preview.svelte';
	import Start from './Start.svelte';

	let fileData = $state<PlacardDataTable>();
</script>

<div
	class="flex min-h-screen w-full flex-col items-center gap-10 bg-gradient-to-br from-violet-100 to-violet-200 p-10"
>
	{#if !fileData}
		<Start setFileData={(data) => (fileData = data)} />
	{:else}
		<Preview bind:fileData={fileData}></Preview>
	{/if}
</div>
