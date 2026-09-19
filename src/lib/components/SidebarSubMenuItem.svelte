<script lang="ts">
	let {
		label,
		href,
		isActive = false
	}: {
		label: string;
		href: string;
		isActive?: boolean;
	} = $props();
</script>

<a
	{href}
	class="flex items-center h-9 text-sm transition-colors
	{isActive
		? 'text-primary font-bold'
		: 'text-sidebar-foreground/70 hover:text-sidebar-accent-foreground'}"
>
	{label}
</a>
