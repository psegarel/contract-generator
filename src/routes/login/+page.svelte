<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import LoginForm from '$lib/components/LoginForm.svelte';

	onMount(() => {
		if (authStore.isAuthenticated) {
			goto('/contracts');
		}
	});
</script>

<div class="min-h-screen flex items-center justify-center px-4 py-12">
	<LoginForm />
</div>
