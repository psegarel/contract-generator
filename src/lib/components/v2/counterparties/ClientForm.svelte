<script lang="ts">
	import type { ClientCounterparty } from '$lib/types/v2';
	import { clientCounterpartySchema, type ClientCounterpartyInput } from '$lib/schemas/v2';
	import { saveCounterparty, updateCounterparty } from '$lib/utils/v2';
	import { authState } from '$lib/state/auth.svelte';
	import { ClientFormState } from '$lib/state/v2/clientFormState.svelte';
	import { onMount } from 'svelte';
	import { Timestamp } from 'firebase/firestore';
	import { Button } from '$lib/components/ui/button';
	import { logger } from '$lib/utils/logger';
	import TextField from '$lib/components/TextField.svelte';
	import TextareaField from '$lib/components/TextareaField.svelte';
	import SelectField from '$lib/components/SelectField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import FormMessage from '$lib/components/FormMessage.svelte';
	import BankNameCombobox from '$lib/components/v2/forms/BankNameCombobox.svelte';

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
			logger.error('Error saving client:', e);
			formState.error = (e as Error).message;
		} finally {
			formState.isSubmitting = false;
		}
	}
</script>

<form
	onsubmit={(e) => {
		e.preventDefault();
		handleSubmit();
	}}
	class="space-y-6"
>
	<!-- Error message -->
	{#if formState.error}
		<FormMessage message={formState.error} />
	{/if}

	<!-- Basic Information -->
	<FormSection title="Basic Information">
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
			<TextField
				id="name"
				label="Name"
				bind:value={formState.name}
				required
				placeholder="John Doe or ABC Corporation"
				class="col-span-full"
			/>

			<SelectField id="clientType" label="Client Type" bind:value={formState.clientType} required>
				<option value="individual">Individual</option>
				<option value="company">Company</option>
			</SelectField>

			<TextField
				id="email"
				label="Email"
				type="email"
				bind:value={formState.email}
				placeholder="client@example.com"
			/>

			<TextField
				id="phone"
				label="Phone"
				type="tel"
				bind:value={formState.phone}
				placeholder="+84 123 456 789"
			/>

			<TextField
				id="address"
				label="Address"
				bind:value={formState.address}
				placeholder="123 Main St, Ho Chi Minh City"
				class="col-span-full"
			/>
		</div>
	</FormSection>

	<!-- Company Details (shown if clientType === 'company') -->
	{#if formState.clientType === 'company'}
		<FormSection title="Company Details">
			<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
				<TextField
					id="companyName"
					label="Company Name"
					bind:value={formState.companyName}
					placeholder="ABC Corporation Ltd"
					class="col-span-full"
				/>

				<TextField
					id="representativeName"
					label="Representative Name"
					bind:value={formState.representativeName}
					placeholder="John Doe"
				/>

				<TextField
					id="representativePosition"
					label="Representative Position"
					bind:value={formState.representativePosition}
					placeholder="CEO, Director"
				/>
			</div>
		</FormSection>
	{/if}

	<!-- Individual Details (shown if clientType === 'individual') -->
	{#if formState.clientType === 'individual'}
		<FormSection title="Individual Details">
			<div class="grid gap-4 grid-cols-1">
				<TextField
					id="idDocument"
					label="ID Document (Passport/ID Number)"
					bind:value={formState.idDocument}
					placeholder="123456789"
				/>
			</div>
		</FormSection>
	{/if}

	<!-- Tax & Banking -->
	<FormSection title="Tax & Banking">
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
			<TextField
				id="taxId"
				label="Tax ID"
				bind:value={formState.taxId}
				placeholder="Tax identification number"
				class="col-span-full"
			/>

			<BankNameCombobox id="bankName" label="Bank Name" bind:value={formState.bankName} />

			<TextField
				id="bankAccountNumber"
				label="Bank Account Number"
				bind:value={formState.bankAccountNumber}
				placeholder="1234567890"
			/>
		</div>
	</FormSection>

	<!-- Notes -->
	<FormSection title="Notes">
		<TextareaField
			id="notes"
			label=""
			bind:value={formState.notes}
			rows={4}
			placeholder="Additional notes about this client..."
		/>
	</FormSection>

	<!-- Form Actions -->
	<div class="flex gap-3 justify-end">
		{#if onCancel}
			<Button type="button" variant="outline" onclick={onCancel} disabled={formState.isSubmitting}>
				Cancel
			</Button>
		{/if}
		<Button type="submit" disabled={formState.isSubmitting} variant="dark">
			{formState.isSubmitting ? 'Saving...' : client ? 'Update Client' : 'Create Client'}
		</Button>
	</div>
</form>
