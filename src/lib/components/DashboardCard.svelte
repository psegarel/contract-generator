<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		class?: string;
	}

	let { children, class: className = '' }: Props = $props();
</script>

<div class="bg-card p-4 lg:p-6 {className}">
	{@render children?.()}
</div>
