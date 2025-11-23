<script lang="ts">
	import AuthGuard from '$lib/components/AuthGuard.svelte';
	import { FileText, ArrowRight, Calendar, Home } from 'lucide-svelte';
</script>

<AuthGuard>
	<div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
		<div class="max-w-6xl mx-auto">
			<!-- Header -->
			<div class="text-center mb-12">
				<h1 class="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-4">
					Contract Templates
				</h1>
				<p class="text-lg text-gray-600 max-w-2xl mx-auto">
					Choose a contract type to get started. Generate professional bilingual documents in seconds.
				</p>
			</div>

			<!-- Contract Cards Grid -->
			<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
				<!-- Service Contract -->
				<a
					href="/service-contract"
					class="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-200 border-2 border-transparent hover:border-blue-500"
				>
					<div class="flex items-center justify-between mb-6">
						<div class="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-xl group-hover:bg-blue-600 transition-colors">
							<FileText class="h-7 w-7 text-blue-600 group-hover:text-white transition-colors" />
						</div>
						<ArrowRight class="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
					</div>
					<h3 class="text-xl font-bold text-gray-900 mb-3">Service Contract</h3>
					<p class="text-gray-600 leading-relaxed mb-4">
						Professional service agreements for freelancers, contractors, and service providers. Includes payment terms and scope of work.
					</p>
					<div class="flex items-center text-sm text-blue-600 font-medium">
						<span>Create contract</span>
					</div>
				</a>

				<!-- Event Contract - Coming Soon -->
				<div class="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200 opacity-60 cursor-not-allowed">
					<div class="flex items-center justify-between mb-6">
						<div class="inline-flex items-center justify-center w-14 h-14 bg-gray-100 rounded-xl">
							<Calendar class="h-7 w-7 text-gray-400" />
						</div>
						<span class="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
							Coming Soon
						</span>
					</div>
					<h3 class="text-xl font-bold text-gray-900 mb-3">Event Contract</h3>
					<p class="text-gray-600 leading-relaxed mb-4">
						Contracts for event planning, venue booking, and entertainment services. Perfect for event organizers.
					</p>
				</div>

				<!-- Rental Contract - Coming Soon -->
				<div class="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200 opacity-60 cursor-not-allowed">
					<div class="flex items-center justify-between mb-6">
						<div class="inline-flex items-center justify-center w-14 h-14 bg-gray-100 rounded-xl">
							<Home class="h-7 w-7 text-gray-400" />
						</div>
						<span class="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
							Coming Soon
						</span>
					</div>
					<h3 class="text-xl font-bold text-gray-900 mb-3">Rental Contract</h3>
					<p class="text-gray-600 leading-relaxed mb-4">
						Rental agreements for property, equipment, and vehicle leasing. Comprehensive terms and conditions.
					</p>
				</div>
			</div>

			<!-- Info Section -->
			<div class="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
				<p class="text-blue-900 font-medium">
					Need a different type of contract? More templates are being added regularly.
				</p>
			</div>
		</div>
	</div>
</AuthGuard>
