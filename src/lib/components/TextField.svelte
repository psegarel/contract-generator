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
		placeholder = '',
		error = '',
		helperText = '',
		class: className = '',
		...rest
	}: HTMLInputAttributes & {
		id: string;
		label: string;
		value?: string | number;
		error?: string;
		helperText?: string;
	} = $props();
</script>

<div class="flex flex-col gap-1 {className}">
	<label for={id} class="block text-sm font-medium text-gray-700 mb-1">
		{label}
		{#if required}
			<span class="text-red-500">*</span>
		{/if}
	</label>
	<input
		{id}
		{type}
		bind:value
		{placeholder}
		{required}
		{...rest}
		class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md text-foreground placeholder:text-muted-foreground/30 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm {error
			? 'border-red-500 focus:ring-red-500/10'
			: ''}"
	/>
	{#if helperText && !error}
		<p class="text-xs text-gray-500 m-0">{helperText}</p>
	{/if}
	{#if error}
		<p class="text-xs text-red-500 m-0">{error}</p>
	{/if}
</div>
