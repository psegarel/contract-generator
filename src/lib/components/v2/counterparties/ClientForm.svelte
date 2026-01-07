<script lang="ts">
	import type { ClientCounterparty } from '$lib/types/v2';
	import { clientCounterpartySchema, type ClientCounterpartyInput } from '$lib/schemas/v2';
	import { saveCounterparty, updateCounterparty } from '$lib/utils/v2';
	import { authState } from '$lib/state/auth.svelte';
	import { ClientFormState } from '$lib/state/v2/clientFormState.svelte';
	import { onMount } from 'svelte';
	import { Timestamp } from 'firebase/firestore';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		client?: ClientCounterparty | null;
		onSuccess?: (clientId: string) => void;
		onCancel?: () => void;
	}

	let { client = null, onSuccess, onCancel }: Props = $props();

	// Create form state instance
	const formState = new ClientFormState();

	// Initialize form state from prop (one-time initialization on mount)
	onMount(() => {
		formState.init(client);
	});

	async function handleSubmit() {
		if (!authState.user) {
			formState.error = 'You must be logged in to create a client';
			return;
		}

		formState.isSubmitting = true;
		formState.error = null;

		try {
			const clientData: ClientCounterpartyInput = {
				type: 'client',
				ownerUid: authState.user.uid,
				name: formState.name,
				email: formState.email || null,
				phone: formState.phone || null,
				address: formState.address || null,
				clientType: formState.clientType,
				companyName: formState.companyName || null,
				representativeName: formState.representativeName || null,
				representativePosition: formState.representativePosition || null,
				idDocument: formState.idDocument || null,
				taxId: formState.taxId || null,
				bankName: formState.bankName || null,
				bankAccountNumber: formState.bankAccountNumber || null,
				notes: formState.notes || null,
				// Timestamps: when creating use Timestamp.now(), when editing preserve createdAt
				createdAt: client?.createdAt || Timestamp.now(),
				updatedAt: Timestamp.now()
			};

			// Validate with schema
			const validationResult = clientCounterpartySchema.safeParse(clientData);
			if (!validationResult.success) {
				formState.error = 'Validation error: ' + validationResult.error.issues[0].message;
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
			formState.error = (e as Error).message;
		} finally {
			formState.isSubmitting = false;
		}
	}
</script>

<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6">
	<!-- Error message -->
	{#if formState.error}
		<div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
			{formState.error}
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
					bind:value={formState.name}
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
					bind:value={formState.clientType}
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
					bind:value={formState.email}
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
					bind:value={formState.phone}
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
					bind:value={formState.address}
					class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					placeholder="123 Main St, Ho Chi Minh City"
				/>
			</div>
		</div>
	</div>

	<!-- Company Details (shown if clientType === 'company') -->
	{#if formState.clientType === 'company'}
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
						bind:value={formState.companyName}
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
						bind:value={formState.representativeName}
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
						bind:value={formState.representativePosition}
						class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
						placeholder="CEO, Director"
					/>
				</div>
			</div>
		</div>
	{/if}

	<!-- Individual Details (shown if clientType === 'individual') -->
	{#if formState.clientType === 'individual'}
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
						bind:value={formState.idDocument}
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
					bind:value={formState.taxId}
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
					bind:value={formState.bankName}
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
					bind:value={formState.bankAccountNumber}
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
			bind:value={formState.notes}
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
				disabled={formState.isSubmitting}
				class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
			>
				Cancel
			</button>
		{/if}
		<Button type="submit" disabled={formState.isSubmitting} variant="dark">
			{formState.isSubmitting ? 'Saving...' : client ? 'Update Client' : 'Create Client'}
		</Button>
	</div>
</form>
