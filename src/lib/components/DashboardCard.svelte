<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		backgroundColor: string;
		textColor: string;
		class?: string;
	}

	let { children, backgroundColor, textColor, class: className = '' }: Props = $props();
</script>

<div
	class="{backgroundColor} {textColor}  bg-card/50 border-border rounded-2xl border p-4 lg:p-8 backdrop-blur-sm {className}"
>
	{@render children?.()}
</div>
