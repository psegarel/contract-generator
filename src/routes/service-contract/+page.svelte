<script lang="ts">
	import AuthGuard from '$lib/components/AuthGuard.svelte';
	import ContractForm from '$lib/components/ContractForm.svelte';
</script>

<AuthGuard>
	<div class="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
		<div class="max-w-4xl mx-auto">
			<div class="mb-8">
				<h1 class="text-3xl font-medium text-foreground mb-3">
					Service Contract Generator
				</h1>
				<p class="text-muted-foreground">
					Generate professional bilingual service contracts
				</p>
			</div>

			<ContractForm />
		</div>
	</div>
</AuthGuard>
