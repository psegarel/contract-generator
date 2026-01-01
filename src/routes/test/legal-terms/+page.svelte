<script lang="ts">
	import LegalTermsSection from '$lib/components/event-planning/LegalTermsSection.svelte';
	import type { LegalTerms } from '$lib/schemas/eventPlanningContract';

	let legalData = $state<LegalTerms>({
		paymentGracePeriodDays: 30,
		terminationNoticeDays: 30,
		negotiationPeriodDays: 30,
		arbitrationLocation: '',
		arbitrationLanguage: 'English / Tiếng Anh'
	});

	let validationErrors = $state<Record<string, string>>({});
	let isValid = $derived(Object.keys(validationErrors).length === 0);

	function handleChange(data: LegalTerms, errors: Record<string, string>) {
		legalData = data;
		validationErrors = errors;
	}
</script>

<div class="max-w-6xl mx-auto p-8">
	<div class="mb-8">
		<h1 class="text-2xl font-bold text-gray-900 mb-2">LegalTermsSection Component Test</h1>
		<p class="text-gray-600">Testing legal terms section with 5 fields (grace periods, arbitration)</p>
	</div>

	<div class="grid gap-8">
		<LegalTermsSection data={legalData} onChange={handleChange} />

		<div class="p-6 bg-gray-50 rounded-lg border border-gray-200">
			<h2 class="text-xl font-semibold text-gray-900 mb-4">Debug Info</h2>

			<div class="mb-6">
				<h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
					Validation Status
				</h3>
				<div
					class="inline-block px-4 py-2 rounded-md font-semibold text-sm {isValid
						? 'bg-green-100 text-green-800'
						: 'bg-red-100 text-red-800'}"
				>
					{isValid ? '✓ Valid' : '✗ Invalid'}
				</div>
			</div>

			<div class="mb-6">
				<h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
					Current Data
				</h3>
				<pre
					class="bg-white p-4 rounded-md border border-gray-200 overflow-x-auto text-sm m-0">{JSON.stringify(legalData, null, 2)}</pre>
			</div>

			<div>
				<h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
					Validation Errors
				</h3>
				<pre
					class="bg-white p-4 rounded-md border border-gray-200 overflow-x-auto text-sm m-0">{JSON.stringify(validationErrors, null, 2)}</pre>
			</div>
		</div>
	</div>
</div>
