<script lang="ts">
	/**
	 * TextareaField - Small, Dumb, Reusable Textarea Component
	 *
	 * Uses pure Tailwind utilities - no custom CSS classes
	 */

	let {
		id,
		label,
		value = '',
		required = false,
		placeholder = '',
		rows = 4,
		error = '',
		helperText = '',
		class: className = '',
		onInput
	}: {
		id: string;
		label: string;
		value?: string | null;
		required?: boolean;
		placeholder?: string;
		rows?: number;
		error?: string;
		helperText?: string;
		class?: string;
		onInput: (value: string) => void;
	} = $props();

	function handleInput(e: Event) {
		const target = e.currentTarget as HTMLTextAreaElement;
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
	<textarea
		{id}
		{value}
		{placeholder}
		{rows}
		oninput={handleInput}
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
