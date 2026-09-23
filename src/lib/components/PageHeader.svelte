<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		description?: string;
		icon?: Snippet;
		leading?: Snippet;
		children?: Snippet;
	}

	let { title, description, icon, leading, children }: Props = $props();
</script>

<header class="flex items-center justify-between gap-6 pb-8">
	<div class="flex min-w-0 items-center gap-3">
		{#if leading}
			{@render leading()}
		{/if}
		{#if icon}
			<div class="flex size-8 shrink-0 items-center justify-center bg-muted text-muted-foreground">
				{@render icon()}
			</div>
		{/if}
		<div class="min-w-0">
			<h1 class="truncate text-2xl font-bold tracking-tight text-foreground">{title}</h1>
			{#if description}
				<p class="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
					{description}
				</p>
			{/if}
		</div>
	</div>
	{#if children}
		<div class="flex shrink-0 items-center gap-2">
			{@render children()}
		</div>
	{/if}
</header>
