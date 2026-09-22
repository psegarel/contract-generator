<script lang="ts">
	/**
	 * SelectField - Reusable Select Component (Design System)
	 *
	 * Styled wrapper around native <select>. Uses design tokens
	 * for consistent styling. Pass <option> elements as children.
	 */

	import type { Snippet } from 'svelte';
	import type { HTMLSelectAttributes } from 'svelte/elements';

	let {
		id,
		label,
		value = $bindable(''),
		required = false,
		labelHidden = false,
		error = '',
		helperText = '',
		class: className = '',
		children,
		...rest
	}: HTMLSelectAttributes & {
		id: string;
		label: string;
		value?: string;
		labelHidden?: boolean;
		error?: string;
		helperText?: string;
		children: Snippet;
	} = $props();
</script>

<div class="flex flex-col gap-1 {className}">
	<label
		for={id}
		class={labelHidden ? 'sr-only' : 'block text-sm font-medium text-foreground mb-1'}
	>
		{label}
		{#if required}
			<span class="text-destructive">*</span>
		{/if}
	</label>
	<select
		{id}
		bind:value
		{required}
		{...rest}
		class="w-full px-3.5 py-2.5 border border-input rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring transition-all text-sm {error
			? 'border-destructive focus:ring-destructive/10'
			: ''}"
	>
		{@render children()}
	</select>
	{#if helperText && !error}
		<p class="text-xs text-muted-foreground m-0">{helperText}</p>
	{/if}
	{#if error}
		<p class="text-xs text-destructive m-0">{error}</p>
	{/if}
</div>
