<script lang="ts">
	/**
	 * TextareaField - Small, Dumb, Reusable Textarea Component
	 *
	 * Uses pure Tailwind utilities - no custom CSS classes
	 * Uses $bindable for modern Svelte 5 two-way binding
	 */

	let {
		id,
		label,
		value = $bindable(''),
		required = false,
		placeholder = '',
		rows = 4,
		error = '',
		helperText = '',
		class: className = ''
	}: {
		id: string;
		label: string;
		value?: string;
		required?: boolean;
		placeholder?: string;
		rows?: number;
		error?: string;
		helperText?: string;
		class?: string;
	} = $props();
</script>

<div class="flex flex-col gap-2 {className}">
	<label for={id} class="text-sm font-medium text-foreground ml-1">
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
		class="w-full px-4 py-3 bg-background rounded-2xl text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all border-none text-sm resize-y min-h-25 {error
			? 'ring-4 ring-destructive/10'
			: ''}"
	></textarea>
	{#if helperText && !error}
		<p class="text-xs text-gray-500 m-0">{helperText}</p>
	{/if}
	{#if error}
		<p class="text-xs text-red-500 m-0">{error}</p>
	{/if}
</div>
