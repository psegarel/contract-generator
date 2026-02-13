<script lang="ts">
	import type { ServiceProvisionContractFormState } from '$lib/state/v2/serviceProvisionContractFormState.svelte';
	import TextField from '$lib/components/TextField.svelte';

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
		<TextField
			id="newProviderName"
			label="Provider Name"
			bind:value={formState.newProviderName}
			required
			placeholder="e.g., ABC Catering Services"
		/>

		<TextField
			id="newProviderServiceType"
			label="Service Type"
			bind:value={formState.newProviderServiceType}
			required
			placeholder="e.g., Catering, Photography, AV Equipment"
		/>

		<TextField
			id="newProviderEmail"
			label="Email"
			type="email"
			bind:value={formState.newProviderEmail}
			placeholder="provider@example.com"
		/>

		<TextField
			id="newProviderPhone"
			label="Phone"
			type="tel"
			bind:value={formState.newProviderPhone}
			placeholder="+84 123 456 789"
		/>
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
