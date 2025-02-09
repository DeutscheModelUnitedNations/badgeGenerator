<script>
	import { configPublic } from '../../config/public';
</script>

<div class="flex w-full flex-col items-center justify-center gap-2 p-10 text-center">
	<div class="flex flex-col gap-2 text-sm">
		<a href="/" class="hover:underline">Home</a>
		<a href="https://dmun.de/impressum" class="hover:underline">Impressum / Datenschutz</a>
	</div>
	<div class="mt-6 text-sm text-zinc-700">
		Copyright © 2024–{new Date().getFullYear()}
		<a href="https://github.com/deutschemodelunitednations" class="hover:underline"
			>Deutsche Model United Nations e.V.</a
		>
		/ <a href="https://github.com/strehk" class="hover:underline">Tade Strehk</a>
	</div>
	<div class="text-sm text-zinc-700">Made with ❤️ in Germany</div>
	<div class="mt-4 text-sm text-zinc-700">
		Version: {configPublic.PUBLIC_VERSION ?? 'dev'}
	</div>
	<div class="text-sm text-zinc-700">
		SHA: {configPublic.PUBLIC_SHA ?? 'n/a'}
	</div>
</div>
