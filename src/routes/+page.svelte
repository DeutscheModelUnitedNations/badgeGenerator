<script lang="ts">
	import type { TableSchema } from '$lib/tableSchema';
	import Preview from './Preview.svelte';
	import Start from './Start.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let fileData = $state<TableSchema>();

	const initialParams = $derived(
		data.sessionData
			? {
					name: data.sessionData.name,
					countryName: data.sessionData.countryName,
					countryAlpha2Code: data.sessionData.countryAlpha2Code,
					alternativeImage: data.sessionData.alternativeImage,
					committee: data.sessionData.committee,
					pronouns: data.sessionData.pronouns,
					id: data.sessionData.id,
					mediaConsentStatus: data.sessionData.mediaConsentStatus
				}
			: undefined
	);

	const hasSessionData = $derived(!!data.sessionData);
	const tokenError = $derived(data.tokenError);
</script>


	{#if tokenError}
		<div class="alert alert-warning max-w-lg">
			<i class="fa-solid fa-triangle-exclamation"></i>
			<span>
				{#if tokenError === 'expired'}
					Der Link ist abgelaufen. Bitte fordere einen neuen Link an.
				{:else if tokenError === 'not_found'}
					Der Link ist ungültig.
				{:else}
					Ein Fehler ist aufgetreten.
				{/if}
			</span>
		</div>
	{/if}

	{#if !fileData}
		<Start setFileData={(data) => (fileData = data)} {initialParams} hasUrlParams={hasSessionData} />
	{:else}
		<Preview bind:fileData={fileData}></Preview>
	{/if}
