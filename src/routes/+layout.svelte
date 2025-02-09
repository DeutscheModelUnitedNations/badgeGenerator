<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<div
	class="flex min-h-screen w-full flex-col items-center gap-10 bg-gradient-to-br from-violet-100 to-violet-200 p-10"
>
	{@render children()}
</div>
