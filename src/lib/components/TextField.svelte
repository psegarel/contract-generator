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
		onInput
	}: {
		id: string;
		label: string;
		value?: string;
		type?: string;
		required?: boolean;
		placeholder?: string;
		error?: string;
		helperText?: string;
		onInput: (value: string) => void;
	} = $props();

	function handleInput(e: Event) {
		const target = e.currentTarget as HTMLInputElement;
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
	<input
		{id}
		{type}
		{value}
		{placeholder}
		oninput={handleInput}
		class="px-3.5 py-2.5 border rounded-md text-sm transition-all font-[inherit] {error
			? 'border-red-500 focus:border-red-500 focus:ring-red-500/10'
			: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/10'} focus:outline-none focus:ring-[3px]"
	/>
	{#if helperText && !error}
		<p class="text-xs text-gray-500 m-0">{helperText}</p>
	{/if}
	{#if error}
		<p class="text-xs text-red-500 m-0">{error}</p>
	{/if}
</div>
