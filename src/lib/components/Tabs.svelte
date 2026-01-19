<script lang="ts" generics="T extends string">
	interface Props {
		tabs: readonly {
			readonly title: string;
			readonly value: T;
		}[];
		activeTab?: T;
		disabled?: boolean;
	}

	let { tabs, activeTab = $bindable(), disabled = false }: Props = $props();
</script>

<div role="tablist" class="tabs-box tabs">
	{#each tabs as { title, value }}
		<button
			role="tab"
			class="tab {activeTab === value && 'tab-active'} {disabled && 'tab-disabled'}"
			onclick={() => (activeTab = value)}
		>
			{title}
		</button>
	{/each}
</div>
