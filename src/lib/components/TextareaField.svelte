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
		onInput: (value: string) => void;
	} = $props();

	function handleInput(e: Event) {
		const target = e.currentTarget as HTMLTextAreaElement;
		onInput(target.value);
	}
</script>

<div class="flex flex-col gap-2">
	<label for={id} class="text-sm font-medium text-gray-700">
		{label}
		{#if required}
			<span class="text-red-500">*</span>
		{/if}
	</label>
	<textarea
		{id}
		{value}
		{placeholder}
		{rows}
		oninput={handleInput}
		class="px-3.5 py-2.5 border rounded-md text-sm transition-all font-[inherit] resize-y min-h-[100px] {error
			? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
			: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/10'} focus:outline-none focus:ring-[3px]"
	></textarea>
	{#if helperText && !error}
		<p class="text-xs text-gray-500 m-0">{helperText}</p>
	{/if}
	{#if error}
		<p class="text-xs text-red-500 m-0">{error}</p>
	{/if}
</div>
