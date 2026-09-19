<script lang="ts">
	import { Avatar as AvatarPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	type Props = AvatarPrimitive.RootProps & {
		initials?: string;
		fallbackClass?: string;
	};

	let {
		ref = $bindable(null),
		loadingStatus = $bindable('loading'),
		class: className = '',
		initials = 'U',
		fallbackClass = '',
		...restProps
	}: Props = $props();
</script>

<AvatarPrimitive.Root
	bind:ref
	bind:loadingStatus
	data-slot="avatar"
	class={cn('relative flex size-8 shrink-0 overflow-hidden rounded-full', className)}
	{...restProps}
>
	<AvatarPrimitive.Fallback
		class={cn(
			'bg-primary flex size-full items-center justify-center rounded-full text-primary-foreground text-xs font-bold',
			fallbackClass
		)}
	>
		{initials}
	</AvatarPrimitive.Fallback>
</AvatarPrimitive.Root>
