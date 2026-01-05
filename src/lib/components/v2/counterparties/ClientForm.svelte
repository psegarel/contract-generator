<script lang="ts">
	import type { ClientCounterparty } from '$lib/types/v2';
	import { clientCounterpartySchema, type ClientCounterpartyInput } from '$lib/schemas/v2';
	import { saveCounterparty, updateCounterparty } from '$lib/utils/v2';
	import { authState } from '$lib/state/auth.svelte';

	interface Props {
		client?: ClientCounterparty | null;
		onSuccess?: (clientId: string) => void;
		onCancel?: () => void;
	}

	let { client = null, onSuccess, onCancel }: Props = $props();

	// Form state - initialize empty, sync with client prop via $effect
	let name = $state('');
	let email = $state('');
	let phone = $state('');
	let address = $state('');
	let clientType = $state<'individual' | 'company'>('individual');
	let companyName = $state('');
	let representativeName = $state('');
	let representativePosition = $state('');
	let idDocument = $state('');
	let taxId = $state('');
	let bankName = $state('');
	let bankAccountNumber = $state('');
	let notes = $state('');

	// Sync form state with client prop (only on initial load or client change)
	// Note: While $effect to sync props to state is generally an anti-pattern,
	// it's acceptable here for handling async prop updates (similar to EventForm.svelte pattern)
	$effect(() => {
		if (client) {
			// Access all properties to ensure they're tracked
			name = client.name;
			email = client.email || '';
			phone = client.phone || '';
			address = client.address || '';
			clientType = client.clientType;
			companyName = client.companyName || '';
			representativeName = client.representativeName || '';
			representativePosition = client.representativePosition || '';
			idDocument = client.idDocument || '';
			taxId = client.taxId || '';
			// Use nullish coalescing to ensure bank fields are strings (not null) for proper input display
			bankName = client.bankName ?? '';
			bankAccountNumber = client.bankAccountNumber ?? '';
			notes = client.notes || '';
		}
	});

	let isSubmitting = $state(false);
	let error = $state<string | null>(null);

	async function handleSubmit() {
		if (!authState.user) {
			error = 'You must be logged in to create a client';
			return;
		}

		isSubmitting = true;
		error = null;

		try {
			const clientData: ClientCounterpartyInput = {
				type: 'client',
				ownerUid: authState.user.uid,
				name,
				email: email || null,
				phone: phone || null,
				address: address || null,
				clientType,
				companyName: companyName || null,
				representativeName: representativeName || null,
				representativePosition: representativePosition || null,
				idDocument: idDocument || null,
				taxId: taxId || null,
				bankName: bankName || null,
				bankAccountNumber: bankAccountNumber || null,
				notes: notes || null
			};

			// Validate with schema
			const validationResult = clientCounterpartySchema.safeParse(clientData);
			if (!validationResult.success) {
				error = 'Validation error: ' + validationResult.error.issues[0].message;
				return;
			}

			let clientId: string;
			if (client) {
				await updateCounterparty(client.id, clientData);
				clientId = client.id;
			} else {
				clientId = await saveCounterparty(clientData);
			}

			if (onSuccess) {
				onSuccess(clientId);
			}
		} catch (e) {
			console.error('Error saving client:', e);
			error = (e as Error).message;
		} finally {
			isSubmitting = false;
		}
	}
</script>

<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6">
	<!-- Error message -->
	{#if error}
		<div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
			{error}
		</div>
	{/if}

	<!-- Basic Information -->
	<div class="bg-white p-6 rounded-lg border border-gray-200">
		<h3 class="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
			<div class="col-span-full">
				<label for="name" class="block text-sm font-medium text-gray-700 mb-1">
					Name <span class="text-red-500">*</span>
				</label>
				<input
					id="name"
					type="text"
					bind:value={name}
					required
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="John Doe or ABC Corporation"
				/>
			</div>

			<div>
				<label for="clientType" class="block text-sm font-medium text-gray-700 mb-1">
					Client Type <span class="text-red-500">*</span>
				</label>
				<select
					id="clientType"
					bind:value={clientType}
					required
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				>
					<option value="individual">Individual</option>
					<option value="company">Company</option>
				</select>
			</div>

			<div>
				<label for="email" class="block text-sm font-medium text-gray-700 mb-1">
					Email
				</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="client@example.com"
				/>
			</div>

			<div>
				<label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
					Phone
				</label>
				<input
					id="phone"
					type="tel"
					bind:value={phone}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="+84 123 456 789"
				/>
			</div>

			<div class="col-span-full">
				<label for="address" class="block text-sm font-medium text-gray-700 mb-1">
					Address
				</label>
				<input
					id="address"
					type="text"
					bind:value={address}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="123 Main St, Ho Chi Minh City"
				/>
			</div>
		</div>
	</div>

	<!-- Company Details (shown if clientType === 'company') -->
	{#if clientType === 'company'}
		<div class="bg-white p-6 rounded-lg border border-gray-200">
			<h3 class="text-lg font-semibold text-gray-900 mb-4">Company Details</h3>
			<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
				<div class="col-span-full">
					<label for="companyName" class="block text-sm font-medium text-gray-700 mb-1">
						Company Name
					</label>
					<input
						id="companyName"
						type="text"
						bind:value={companyName}
						class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
						placeholder="ABC Corporation Ltd"
					/>
				</div>

				<div>
					<label for="representativeName" class="block text-sm font-medium text-gray-700 mb-1">
						Representative Name
					</label>
					<input
						id="representativeName"
						type="text"
						bind:value={representativeName}
						class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
						placeholder="John Doe"
					/>
				</div>

				<div>
					<label for="representativePosition" class="block text-sm font-medium text-gray-700 mb-1">
						Representative Position
					</label>
					<input
						id="representativePosition"
						type="text"
						bind:value={representativePosition}
						class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
						placeholder="CEO, Director"
					/>
				</div>
			</div>
		</div>
	{/if}

	<!-- Individual Details (shown if clientType === 'individual') -->
	{#if clientType === 'individual'}
		<div class="bg-white p-6 rounded-lg border border-gray-200">
			<h3 class="text-lg font-semibold text-gray-900 mb-4">Individual Details</h3>
			<div class="grid gap-4 grid-cols-1">
				<div>
					<label for="idDocument" class="block text-sm font-medium text-gray-700 mb-1">
						ID Document (Passport/ID Number)
					</label>
					<input
						id="idDocument"
						type="text"
						bind:value={idDocument}
						class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
						placeholder="123456789"
					/>
				</div>
			</div>
		</div>
	{/if}

	<!-- Tax & Banking -->
	<div class="bg-white p-6 rounded-lg border border-gray-200">
		<h3 class="text-lg font-semibold text-gray-900 mb-4">Tax & Banking</h3>
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
			<div class="col-span-full">
				<label for="taxId" class="block text-sm font-medium text-gray-700 mb-1">
					Tax ID
				</label>
				<input
					id="taxId"
					type="text"
					bind:value={taxId}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="Tax identification number"
				/>
			</div>

			<div>
				<label for="bankName" class="block text-sm font-medium text-gray-700 mb-1">
					Bank Name
				</label>
				<input
					id="bankName"
					type="text"
					bind:value={bankName}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="Vietcombank"
				/>
			</div>

			<div>
				<label for="bankAccountNumber" class="block text-sm font-medium text-gray-700 mb-1">
					Bank Account Number
				</label>
				<input
					id="bankAccountNumber"
					type="text"
					bind:value={bankAccountNumber}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="1234567890"
				/>
			</div>
		</div>
	</div>

	<!-- Notes -->
	<div class="bg-white p-6 rounded-lg border border-gray-200">
		<h3 class="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
		<textarea
			id="notes"
			bind:value={notes}
			rows="4"
			class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			placeholder="Additional notes about this client..."
		></textarea>
	</div>

	<!-- Form Actions -->
	<div class="flex gap-3 justify-end">
		{#if onCancel}
			<button
				type="button"
				onclick={onCancel}
				disabled={isSubmitting}
				class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
			>
				Cancel
			</button>
		{/if}
		<button
			type="submit"
			disabled={isSubmitting}
			class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
		>
			{isSubmitting ? 'Saving...' : client ? 'Update Client' : 'Create Client'}
		</button>
	</div>
</form>
