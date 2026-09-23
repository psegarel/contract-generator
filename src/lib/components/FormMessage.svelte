<script lang="ts">
	interface Props {
		message: string;
		variant?: 'error' | 'warning' | 'info';
	}

	let { message, variant = 'error' }: Props = $props();

	const variantClasses = {
		error: 'bg-destructive/10 text-destructive',
		warning: 'bg-muted text-foreground',
		info: 'bg-primary/5 text-foreground'
	};
</script>

<div class="p-4 text-sm {variantClasses[variant]}" role={variant === 'error' ? 'alert' : undefined}>
	{message}
</div>
