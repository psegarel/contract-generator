<script lang="ts">
	/**
	 * TextField - Reusable Input Component (Design System)
	 *
	 * Styled wrapper around native <input>. Supports all input types
	 * (text, number, date, etc.) and forwards additional HTML attributes.
	 */

	import type { HTMLInputAttributes } from 'svelte/elements';

	let {
		id,
		label,
		value = $bindable(''),
		type = 'text',
		required = false,
		labelHidden = false,
		placeholder = '',
		error = '',
		helperText = '',
		class: className = '',
		...rest
	}: HTMLInputAttributes & {
		id: string;
		label: string;
		value?: string | number;
		labelHidden?: boolean;
		error?: string;
		helperText?: string;
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
	<input
		{id}
		{type}
		bind:value
		{placeholder}
		{required}
		{...rest}
		class="w-full bg-muted/50 px-3.5 py-2.5 rounded-sm text-foreground placeholder:text-muted-foreground/30 focus:bg-background focus:ring-2 focus:ring-ring transition-colors text-sm {error
			? 'ring-2 ring-destructive/20'
			: ''}"
	/>
	{#if helperText && !error}
		<p class="text-xs text-muted-foreground m-0">{helperText}</p>
	{/if}
	{#if error}
		<p class="text-xs text-destructive m-0">{error}</p>
	{/if}
</div>
