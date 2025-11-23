<script lang="ts">
	import AuthGuard from '$lib/components/AuthGuard.svelte';
	import ContractForm from '$lib/components/ContractForm.svelte';
	import { FileText } from 'lucide-svelte';
</script>

<AuthGuard>
	<div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
		<div class="max-w-4xl mx-auto">
			<div class="text-center mb-12">
				<h1 class="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-4">
					Service Contract Generator
				</h1>
				<p class="text-lg text-gray-600 max-w-2xl mx-auto">
					Generate professional bilingual (English & Vietnamese) service contracts in seconds.
					Simply fill in the details below and download your Word document.
				</p>
			</div>

			<ContractForm />

			<footer class="mt-12 text-center text-sm text-gray-500">
				<p>&copy; {new Date().getFullYear()} Contract Generator. All rights reserved.</p>
			</footer>
		</div>
	</div>
</AuthGuard>
