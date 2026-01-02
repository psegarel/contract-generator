<script lang="ts">
	/**
	 * TextField - Small, Dumb, Reusable Input Component
	 *
	 * Uses pure Tailwind utilities - no custom CSS classes
	 */

	let {
		id,
		label,
		value = '',
		type = 'text',
		required = false,
		placeholder = '',
		error = '',
		helperText = '',
		class: className = '',
		onInput
	}: {
		id: string;
		label: string;
		value?: string | null;
		type?: string;
		required?: boolean;
		placeholder?: string;
		error?: string;
		helperText?: string;
		class?: string;
		onInput: (value: string) => void;
	} = $props();

	function handleInput(e: Event) {
		const target = e.currentTarget as HTMLInputElement;
		onInput(target.value);
	}
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
		{value}
		{placeholder}
		oninput={handleInput}
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
