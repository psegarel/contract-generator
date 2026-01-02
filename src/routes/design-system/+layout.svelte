<script lang="ts">
	import '@fontsource-variable/inter';
	import '@fontsource/geist-sans';
	import { resolve } from '$app/paths';
	import { themeState } from '$lib/state/theme.svelte';
	import {
		LayoutDashboard,
		Users,
		FileText,
		Settings,
		Search,
		Bell,
		Sun,
		Moon,
		Plus,
		ChevronRight,
		Menu
	} from 'lucide-svelte';

	let { children } = $props();
</script>

<div class="h-screen bg-background overflow-hidden text-foreground flex flex-col">
	<!-- Main Content Area -->
	<main class="flex-1 flex flex-col overflow-hidden">
		<!-- Top Bar -->
		<header
			class="h-16 border-b border-border glass flex items-center justify-between px-8 shrink-0"
		>
			<div class="flex items-center flex-1 max-w-xl">
				<div class="relative w-full">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<input
						type="text"
						placeholder="Search design patterns..."
						class="w-full bg-muted/50 border-none rounded-full pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary/20 transition-all"
					/>
				</div>
			</div>

			<div class="flex items-center space-x-4">
				<div
					class="flex items-center space-x-2 text-xs font-bold text-muted-foreground uppercase tracking-widest"
				>
					<div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
					<span>Design Mode</span>
				</div>
				<div class="h-6 w-px bg-border mx-2"></div>
				<button
					onclick={() => themeState.toggle()}
					class="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
				>
					{#if themeState.theme === 'dark'}
						<Sun class="h-5 w-5" />
					{:else}
						<Moon class="h-5 w-5" />
					{/if}
				</button>
			</div>
		</header>

		<!-- Fluid Viewport -->
		<section class="flex-1 overflow-y-auto p-8 bg-muted/10">
			<!-- Dashboard Content Header -->
			<div class="mb-10 flex justify-between items-end">
				<div>
					<h1 class="text-4xl font-extrabold tracking-tight">Design System Prototype</h1>
					<p class="text-muted-foreground mt-2 text-lg">
						Evaluating the fluid sidebar layout and typography.
					</p>
				</div>
				<button
					class="bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-bold flex items-center shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95"
				>
					<Plus class="mr-2 h-5 w-5" />
					Create Contract
				</button>
			</div>

			{@render children()}
		</section>
	</main>
</div>

<style>
	:global(body) {
		font-family: 'Inter Variable', sans-serif;
	}

	:global(h1, h2, h3, h4, h5, h6) {
		font-family: 'Geist Sans', sans-serif;
	}

	.glass {
		background: rgba(var(--background-rgb), 0.7);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
	}
</style>
