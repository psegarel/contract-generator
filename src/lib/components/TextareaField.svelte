<script lang="ts">
	/**
	 * TextareaField - Reusable Textarea Component (Design System)
	 *
	 * Styled wrapper around native <textarea>. Uses design tokens
	 * for consistent styling across the application.
	 */

	import type { HTMLTextareaAttributes } from 'svelte/elements';

	let {
		id,
		label,
		value = $bindable(''),
		required = false,
		placeholder = '',
		rows = 4,
		error = '',
		helperText = '',
		class: className = '',
		...rest
	}: HTMLTextareaAttributes & {
		id: string;
		label: string;
		value?: string;
		error?: string;
		helperText?: string;
	} = $props();
</script>

<div class="flex flex-col gap-1 {className}">
	<label for={id} class="block text-sm font-medium text-foreground mb-1">
		{label}
		{#if required}
			<span class="text-destructive">*</span>
		{/if}
	</label>
	<textarea
		{id}
		bind:value
		{placeholder}
		{rows}
		{required}
		{...rest}
		class="w-full px-3.5 py-2.5 border border-input rounded-md text-foreground placeholder:text-muted-foreground/30 focus:ring-2 focus:ring-ring focus:border-ring transition-all text-sm resize-y min-h-25 {error
			? 'border-destructive focus:ring-destructive/10'
			: ''}"
	></textarea>
	{#if helperText && !error}
		<p class="text-xs text-muted-foreground m-0">{helperText}</p>
	{/if}
	{#if error}
		<p class="text-xs text-destructive m-0">{error}</p>
	{/if}
</div>
