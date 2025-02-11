<script lang="ts">
	interface Props {
		errors: {
			message: string;
			details?: string;
			path: (string | number)[];
		}[];
	}
	let { errors }: Props = $props();
</script>

<div class="w-full overflow-auto rounded-lg bg-base-100 p-4 shadow-sm">
	<table class="table overflow-auto">
		<thead>
			<tr>
				<th>
					<div class="badge badge-error">Zeile</div>
					<div class="badge badge-neutral">Spalte</div>
				</th>
				<th>Warnung</th>
				{#if errors.some((e) => e.details)}
					<th>Details</th>
				{/if}
			</tr>
		</thead>
		<tbody>
			{#each errors as error}
				{@const path = error.path}
				<tr>
					<td class="flex gap-1">
						<div class="badge badge-error">
							{(typeof path[0] === 'string' ? parseInt(path[0]) : path[0]) + 2}
						</div>
						{#each path.slice(1) as p}
							<div class="badge badge-neutral">{p}</div>
						{/each}
					</td>
					<td class="text-base-content">{@html error.message}</td>
					{#if error.details}
						<td class="text-base-content">
							{@html error.details}
						</td>
					{/if}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
