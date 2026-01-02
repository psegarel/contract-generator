<script lang="ts">
	import { authState } from '$lib/state/auth.svelte';
	import { ArrowRight } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
</script>

<div class="min-h-screen flex items-center justify-center px-4">
	<div class="max-w-2xl mx-auto text-center">
		<h1 class="text-6xl md:text-7xl font-medium text-foreground tracking-tight mb-4">
			Internal Contract
			<span class="block text-primary"> Generator </span>
		</h1>

		<p class="text-lg text-muted-foreground mb-12 max-w-md mx-auto">
			Streamlined contract generation for internal use
		</p>

		<div class="flex flex-col sm:flex-row items-center justify-center gap-3">
			{#if authState.isAuthenticated}
				<Button href="/contracts" class="group" variant="default" size="lg">
					<span>Go to Contracts</span>
					<ArrowRight class="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
				</Button>
			{:else}
				<Button href="/login" class="group" variant="default" size="lg">
					<span>Sign In</span>
					<ArrowRight class="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
				</Button>
			{/if}
		</div>
	</div>
</div>
