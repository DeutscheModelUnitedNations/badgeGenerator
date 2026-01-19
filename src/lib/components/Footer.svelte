<script>
	import { configPublic } from '../../config/public';
</script>

<div class="flex w-full flex-col items-center justify-center gap-2 p-10 text-center">
	<div class="flex flex-col gap-2 text-sm">
		<a href="/" class="hover:underline">Home</a>
		<a href="https://dmun.de/impressum" class="hover:underline">Impressum / Datenschutz</a>
	</div>
	<div class="mt-6 text-sm">
		Copyright © 2024–{new Date().getFullYear()}
		<a href="https://github.com/deutschemodelunitednations" class="hover:underline"
			><i class="fa-brands fa-github"></i> Deutsche Model United Nations e.V.</a
		>
		/ <a href="https://github.com/strehk" class="hover:underline"><i class="fa-brands fa-github"></i> Tade Strehk</a>
	</div>
	<div class="text-sm ">Made with ❤️ in Germany</div>
	<div class="mt-4 text-sm">
		Version: {configPublic.PUBLIC_VERSION ?? 'dev'}
	</div>
	<div class="text-sm">
		SHA: {configPublic.PUBLIC_SHA ?? 'n/a'}
	</div>
</div>
