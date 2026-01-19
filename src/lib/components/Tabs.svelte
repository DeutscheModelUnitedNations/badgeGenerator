<script lang="ts" generics="T extends string">
	interface Props {
		tabs: readonly {
			readonly title: string;
			readonly value: T;
			readonly icon?: string;
		}[];
		activeTab?: T;
		disabled?: boolean;
	}

	let { tabs, activeTab = $bindable(), disabled = false }: Props = $props();
</script>

<div role="tablist" class="tabs-box tabs w-full">
	{#each tabs as { title, value, icon }}
		<button
			role="tab"
			class="tab flex-1 {activeTab === value && 'tab-active'} {disabled && 'tab-disabled'}"
			onclick={() => (activeTab = value)}
		>
			{#if icon}<i class="{icon} w-4 h-4 mr-2"></i>{/if}
			{title}
		</button>
	{/each}
</div>
