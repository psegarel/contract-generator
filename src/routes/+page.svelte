<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { FileText, Lock, Zap, Globe, ArrowRight, CheckCircle } from 'lucide-svelte';
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
	<!-- Hero Section -->
	<div class="relative overflow-hidden">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
			<div class="text-center">
				<div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-8 shadow-lg">
					<FileText class="h-10 w-10 text-white" />
				</div>
				
				<h1 class="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
					Professional Contract
					<span class="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
						Generation Made Easy
					</span>
				</h1>
				
				<p class="text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
					Create professional, bilingual contracts in seconds. No legal expertise required.
					Perfect for freelancers, agencies, and businesses of all sizes.
				</p>

				<div class="flex flex-col sm:flex-row items-center justify-center gap-4">
					{#if authStore.isAuthenticated}
						<a
							href="/contracts"
							class="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-200"
						>
							<span>Go to Contracts</span>
							<ArrowRight class="h-5 w-5" />
						</a>
					{:else}
						<a
							href="/login"
							class="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-200"
						>
							<span>Sign In</span>
							<ArrowRight class="h-5 w-5" />
						</a>
						<p class="text-sm text-gray-500 mt-2">
							Access is by invitation only. Contact your administrator for an account.
						</p>
					{/if}
				</div>
			</div>
		</div>

		<!-- Decorative background elements -->
		<div class="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
			<div class="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
			<div class="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style="animation-delay: 1s;"></div>
		</div>
	</div>

	<!-- Features Section -->
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
		<div class="text-center mb-16">
			<h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
				Why Choose Our Platform?
			</h2>
			<p class="text-lg text-gray-600 max-w-2xl mx-auto">
				Everything you need to create professional contracts quickly and efficiently
			</p>
		</div>

		<div class="grid md:grid-cols-3 gap-8">
			<!-- Feature 1 -->
			<div class="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-200 border border-gray-100">
				<div class="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-xl mb-6">
					<Zap class="h-7 w-7 text-blue-600" />
				</div>
				<h3 class="text-xl font-bold text-gray-900 mb-3">Lightning Fast</h3>
				<p class="text-gray-600 leading-relaxed">
					Generate complete contracts in seconds. No more hours spent on formatting and legal jargon.
				</p>
			</div>

			<!-- Feature 2 -->
			<div class="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-200 border border-gray-100">
				<div class="inline-flex items-center justify-center w-14 h-14 bg-purple-100 rounded-xl mb-6">
					<Globe class="h-7 w-7 text-purple-600" />
				</div>
				<h3 class="text-xl font-bold text-gray-900 mb-3">Bilingual Support</h3>
				<p class="text-gray-600 leading-relaxed">
					Every contract is generated in both English and Vietnamese, perfect for international work.
				</p>
			</div>

			<!-- Feature 3 -->
			<div class="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-200 border border-gray-100">
				<div class="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-xl mb-6">
					<Lock class="h-7 w-7 text-green-600" />
				</div>
				<h3 class="text-xl font-bold text-gray-900 mb-3">Secure & Private</h3>
				<p class="text-gray-600 leading-relaxed">
					Your data is protected with enterprise-grade security. We never share your information.
				</p>
			</div>
		</div>
	</div>

	<!-- Contract Types Section -->
	<div class="bg-white py-20">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="text-center mb-16">
				<h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
					Available Contract Types
				</h2>
				<p class="text-lg text-gray-600 max-w-2xl mx-auto">
					More contract types coming soon!
				</p>
			</div>

			<div class="max-w-2xl mx-auto">
				<div class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border-2 border-blue-200">
					<div class="flex items-start space-x-4">
						<div class="flex-shrink-0">
							<CheckCircle class="h-8 w-8 text-blue-600" />
						</div>
						<div>
							<h3 class="text-2xl font-bold text-gray-900 mb-2">Service Contracts</h3>
							<p class="text-gray-600 mb-4">
								Professional service agreements for freelancers, contractors, and service providers.
								Includes payment terms, scope of work, and legal protections.
							</p>
							{#if authStore.isAuthenticated}
								<a
									href="/service-contract"
									class="inline-flex items-center space-x-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
								>
									<span>Create Service Contract</span>
									<ArrowRight class="h-4 w-4" />
								</a>
							{:else}
								<a
									href="/login"
									class="inline-flex items-center space-x-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
								>
									<span>Sign in to create</span>
									<ArrowRight class="h-4 w-4" />
								</a>
							{/if}
						</div>
					</div>
				</div>

				<div class="mt-6 text-center text-gray-500">
					<p class="text-sm">Coming soon: Event Contracts, Rental Agreements, and more...</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Footer -->
	<footer class="bg-gray-50 border-t border-gray-200 py-12">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="text-center text-gray-600">
				<p class="text-sm">
					&copy; {new Date().getFullYear()} Contract Generator. All rights reserved.
				</p>
			</div>
		</div>
	</footer>
</div>
