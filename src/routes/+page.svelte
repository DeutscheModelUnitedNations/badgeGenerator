<script lang="ts">
	import type { PlacardDataTable } from '$lib/tableSchema';
	import Preview from './Preview.svelte';

	import Start from './Start.svelte';

	let fileData = $state<PlacardDataTable>();
</script>

<div
	class="flex min-h-screen w-full flex-col items-center justify-center gap-10 bg-gradient-to-br from-neutral-700 to-neutral-800 p-10"
>
	{#if !fileData}
		<Start setFileData={(data) => (fileData = data)} />
	{:else}
		<Preview {fileData}></Preview>
	{/if}
</div>
