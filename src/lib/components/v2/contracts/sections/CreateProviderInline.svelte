<script lang="ts">
	import type { ServiceProvisionContractFormState } from '$lib/state/v2/serviceProvisionContractFormState.svelte';

	interface Props {
		formState: ServiceProvisionContractFormState;
		onCancel: () => void;
		onCreate: () => Promise<void>;
	}

	let { formState, onCancel, onCreate }: Props = $props();
</script>

<div class="bg-blue-50 border border-blue-200 p-6 rounded-lg">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Create New Service Provider</h3>
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<div>
			<label for="newProviderName" class="block text-sm font-medium text-gray-700 mb-1">
				Provider Name <span class="text-red-500">*</span>
			</label>
			<input
				id="newProviderName"
				type="text"
				bind:value={formState.newProviderName}
				placeholder="e.g., ABC Catering Services"
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			/>
		</div>

		<div>
			<label for="newProviderServiceType" class="block text-sm font-medium text-gray-700 mb-1">
				Service Type <span class="text-red-500">*</span>
			</label>
			<input
				id="newProviderServiceType"
				type="text"
				bind:value={formState.newProviderServiceType}
				placeholder="e.g., Catering, Photography, AV Equipment"
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			/>
		</div>

		<div>
			<label for="newProviderEmail" class="block text-sm font-medium text-gray-700 mb-1">
				Email
			</label>
			<input
				id="newProviderEmail"
				type="email"
				bind:value={formState.newProviderEmail}
				placeholder="provider@example.com"
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			/>
		</div>

		<div>
			<label for="newProviderPhone" class="block text-sm font-medium text-gray-700 mb-1">
				Phone
			</label>
			<input
				id="newProviderPhone"
				type="tel"
				bind:value={formState.newProviderPhone}
				placeholder="+84 123 456 789"
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			/>
		</div>
	</div>

	<div class="flex gap-3 justify-end mt-4">
		<button
			type="button"
			onclick={onCancel}
			class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
		>
			Cancel
		</button>
		<button
			type="button"
			onclick={onCreate}
			disabled={formState.isCreatingProvider}
			class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
		>
			{formState.isCreatingProvider ? 'Creating...' : 'Create Provider'}
		</button>
	</div>
</div>
