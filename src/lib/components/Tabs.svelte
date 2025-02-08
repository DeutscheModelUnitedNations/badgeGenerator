<script lang="ts" generics="T extends string">
	interface Props {
		tabs: readonly {
			readonly title: string;
			readonly value: T;
		}[];
		activeTab?: T;
	}

	let { tabs, activeTab = $bindable() }: Props = $props();
</script>

<div role="tablist" class="tabs-boxed tabs">
	{#each tabs as { title, value }}
		<button
			role="tab"
			class="tab {activeTab === value && 'tab-active'}"
			onclick={() => (activeTab = value)}
		>
			{title}
		</button>
	{/each}
</div>
