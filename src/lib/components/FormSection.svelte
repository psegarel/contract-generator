<script lang="ts">
	/**
	 * FormSection - Section container with title (Design System)
	 *
	 * Encapsulates the repeated card-like section pattern used
	 * across all form pages.
	 */

	import type { Snippet } from 'svelte';

	let {
		title,
		children,
		class: className = ''
	}: {
		title: string;
		children: Snippet;
		class?: string;
	} = $props();
</script>

<div class="bg-card p-6 rounded-lg border border-border {className}">
	<h3 class="text-lg font-semibold text-foreground mb-6">{title}</h3>
	{@render children()}
</div>
