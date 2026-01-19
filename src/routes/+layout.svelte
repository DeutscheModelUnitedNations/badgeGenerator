<script lang="ts">
	import '../app.css';
	import Footer from '$lib/components/Footer.svelte';
	let { children } = $props();
</script>

<div
	class="flex min-h-screen w-full flex-col items-center gap-10 bg-gradient-to-br from-primary/10 to-primary/20 p-10 dark:from-base-200 dark:to-base-100"
>
	{@render children()}
</div>
<Footer />
