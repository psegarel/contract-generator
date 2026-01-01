<script lang="ts">
	import ContractInfoSection from '$lib/components/event-planning/ContractInfoSection.svelte';
	import type { ContractInfo } from '$lib/schemas/eventPlanningContract';

	/**
	 * Test page for ContractInfoSection component
	 * Navigate to: /test/contract-info
	 */

	let contractData = $state<ContractInfo>({
		contractDate: '',
		contractLocation: ''
	});

	let validationErrors = $state<Record<string, string>>({});
	let isValid = $derived(Object.keys(validationErrors).length === 0 && contractData.contractDate && contractData.contractLocation);

	function handleChange(data: ContractInfo, errors: Record<string, string>) {
		contractData = data;
		validationErrors = errors;
	}
</script>

<div class="test-page">
	<div class="header">
		<h1>ContractInfoSection Component Test</h1>
		<p class="subtitle">Testing the first section component with 2 fields</p>
	</div>

	<div class="content">
		<!-- The Component Being Tested -->
		<ContractInfoSection data={contractData} onChange={handleChange} />

		<!-- Debug Panel -->
		<div class="debug-panel">
			<h2>Debug Info</h2>

			<div class="debug-section">
				<h3>Validation Status</h3>
				<div class="status-badge" class:valid={isValid} class:invalid={!isValid}>
					{isValid ? '✓ Valid' : '✗ Invalid'}
				</div>
			</div>

			<div class="debug-section">
				<h3>Current Data</h3>
				<pre>{JSON.stringify(contractData, null, 2)}</pre>
			</div>

			<div class="debug-section">
				<h3>Validation Errors</h3>
				<pre>{JSON.stringify(validationErrors, null, 2)}</pre>
			</div>
		</div>
	</div>
</div>

<style>
	.test-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.header {
		margin-bottom: 2rem;
	}

	.header h1 {
		font-size: 2rem;
		font-weight: 700;
		color: #111827;
		margin-bottom: 0.5rem;
	}

	.subtitle {
		color: #6b7280;
		font-size: 1rem;
	}

	.content {
		display: grid;
		gap: 2rem;
	}

	.debug-panel {
		padding: 1.5rem;
		background: #f9fafb;
		border-radius: 0.5rem;
		border: 1px solid #e5e7eb;
	}

	.debug-panel h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #111827;
		margin-bottom: 1rem;
	}

	.debug-section {
		margin-bottom: 1.5rem;
	}

	.debug-section:last-child {
		margin-bottom: 0;
	}

	.debug-section h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		margin-bottom: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.status-badge {
		display: inline-block;
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		font-weight: 600;
		font-size: 0.875rem;
	}

	.status-badge.valid {
		background: #dcfce7;
		color: #166534;
	}

	.status-badge.invalid {
		background: #fee2e2;
		color: #991b1b;
	}

	pre {
		background: white;
		padding: 1rem;
		border-radius: 0.375rem;
		border: 1px solid #e5e7eb;
		overflow-x: auto;
		font-size: 0.875rem;
		margin: 0;
	}
</style>
