<script lang="ts">
	interface Props {
		tabs: {
			title: string;
			value: string;
			active?: boolean;
		}[];
		activeTab?: string;
		onClick: (value: string) => void;
	}

	let { tabs, activeTab, onClick }: Props = $props();
</script>

<div role="tablist" class="tabs-boxed tabs">
	{#each tabs as { title, value, active }}
		<button
			role="tab"
			class="tab {(active || activeTab === value) && 'tab-active'}"
			onclick={() => onClick(value)}
		>
			{title}
		</button>
	{/each}
</div>
