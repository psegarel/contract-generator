<script lang="ts">
	import { ChevronRight } from 'lucide-svelte';
	import type { ComponentType } from 'svelte';
	import { animate } from 'motion';
	import SidebarSubMenuItem from './SidebarSubMenuItem.svelte';

	interface SubItem {
		label: string;
		href: string;
	}

	let {
		icon: Icon,
		label,
		href,
		subItems = undefined,
		isActive = false,
		sidebarOpen = true,
		expanded = $bindable(false),
		currentPath = ''
	}: {
		icon: ComponentType;
		label: string;
		href: string;
		subItems?: SubItem[];
		isActive?: boolean;
		sidebarOpen?: boolean;
		expanded?: boolean;
		currentPath?: string;
	} = $props();

	function handleClick(e: MouseEvent) {
		if (subItems) {
			e.preventDefault();
			expanded = !expanded;
		}
	}

	// Action for sub-menu animations
	function submenuAnimation(node: HTMLElement, isOpen: boolean) {
		let controls: any;
		let currentTarget = isOpen;

		const ITEM_HEIGHT = 32; // Defined by h-8
		const PADDING_OFFSET = 12; // mt-1 (4px) + pb-2 (8px)

		const runAnimation = (open: boolean) => {
			currentTarget = open;
			if (controls) controls.stop();

			const inner = node.firstElementChild as HTMLElement;
			const itemCount = inner?.children.length || 0;
			const targetHeight = open ? itemCount * ITEM_HEIGHT + PADDING_OFFSET : 0;
			const startHeight = node.getBoundingClientRect().height;

			if (open) {
				node.style.display = 'block';
			}

			controls = animate(
				node,
				{
					height: [startHeight + 'px', targetHeight + 'px'],
					opacity: open ? 1 : 0
				},
				{
					type: 'spring',
					stiffness: 200,
					damping: 25,
					mass: 0.5
				}
			);

			controls.then(() => {
				if (!open && !currentTarget) {
					node.style.display = 'none';
				}
			});
		};

		// Set initial state
		const inner = node.firstElementChild as HTMLElement;
		const itemCount = inner?.children.length || 0;
		const targetHeight = itemCount * ITEM_HEIGHT + PADDING_OFFSET;

		if (!isOpen) {
			node.style.display = 'none';
			node.style.height = '0px';
			node.style.opacity = '0';
		} else {
			node.style.display = 'block';
			node.style.height = targetHeight + 'px';
			node.style.opacity = '1';
		}

		return {
			update(newIsOpen: boolean) {
				runAnimation(newIsOpen);
			},
			destroy() {
				if (controls) controls.stop();
			}
		};
	}
</script>

<div>
	<a
		{href}
		onclick={handleClick}
		class="flex items-center px-3 py-2.5 rounded-xl transition-all group
		{isActive
			? 'bg-primary/10 text-primary font-semibold'
			: 'hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground'}"
	>
		<Icon
			class="h-5 w-5 transition-colors {isActive
				? 'text-primary'
				: 'text-sidebar-foreground group-hover:text-primary'}"
		/>
		{#if sidebarOpen}
			<span class="ml-3 font-medium text-sm">{label}</span>
			{#if subItems}
				<ChevronRight
					class="ml-auto h-4 w-4 transition-transform {expanded ? 'rotate-90' : ''}"
				/>
			{/if}
		{/if}
	</a>

	{#if sidebarOpen && subItems}
		<div use:submenuAnimation={expanded} class="overflow-hidden">
			<div class="ml-9 mt-1 space-y-1 pb-2">
				{#each subItems as sub}
					<SidebarSubMenuItem label={sub.label} href={sub.href} isActive={currentPath === sub.href} />
				{/each}
			</div>
		</div>
	{/if}
</div>
