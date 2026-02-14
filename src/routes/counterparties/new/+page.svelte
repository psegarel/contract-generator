<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		goto('/counterparties/new/client', { replaceState: true });
	});
</script>

<div class="flex items-center justify-center py-20">
	<p class="text-muted-foreground">Redirecting...</p>
</div>
