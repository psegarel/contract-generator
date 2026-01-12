<script lang="ts">
	/**
	 * TextField - Small, Dumb, Reusable Input Component
	 *
	 * Uses pure Tailwind utilities - no custom CSS classes
	 * Uses $bindable for modern Svelte 5 two-way binding
	 */

	let {
		id,
		label,
		value = $bindable(''),
		type = 'text',
		required = false,
		placeholder = '',
		error = '',
		helperText = '',
		class: className = ''
	}: {
		id: string;
		label: string;
		value?: string;
		type?: string;
		required?: boolean;
		placeholder?: string;
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
	<input
		{id}
		{type}
		bind:value
		{placeholder}
		class="w-full px-4 py-3 bg-background rounded-2xl text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all border-none text-sm {error
			? 'ring-4 ring-destructive/10'
			: ''}"
	/>
	{#if helperText && !error}
		<p class="text-xs text-gray-500 m-0">{helperText}</p>
	{/if}
	{#if error}
		<p class="text-xs text-red-500 m-0">{error}</p>
	{/if}
</div>
