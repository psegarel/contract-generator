<script lang="ts">
	import TextField from '$lib/components/TextField.svelte';
	import { PERFORMER_TYPES } from '$lib/config/counterpartyTypes';

	interface PerformerInlineFormState {
		name: string;
		stageName: string;
		performerType: string;
		genre: string;
		email: string;
		phone: string;
		bankName: string;
		bankAccountNumber: string;
		idDocument: string;
		taxId: string;
		isSubmitting: boolean;
	}

	interface Props {
		formState: PerformerInlineFormState;
		onCancel: () => void;
		onCreate: () => Promise<void>;
	}

	let { formState, onCancel, onCreate }: Props = $props();
</script>

<div class="bg-blue-50 border border-blue-200 p-6 rounded-lg space-y-6">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Add New Performer</h3>

	<!-- Basic Information -->
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<TextField
			id="performerName"
			label="Legal Name"
			bind:value={formState.name}
			placeholder="e.g., Nguyen Thi Mai"
			required
		/>
		<TextField
			id="performerStageName"
			label="Stage Name"
			bind:value={formState.stageName}
			placeholder="e.g., DJ Mai"
			required
		/>
		<div>
			<label for="performerType" class="text-sm font-medium text-foreground ml-1">
				Performer Type
				<span class="text-destructive">*</span>
			</label>
			<select
				id="performerType"
				bind:value={formState.performerType}
				class="w-full px-4 py-3 bg-background rounded-2xl text-foreground focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all border-none text-sm mt-2"
			>
				<option value="">Select type</option>
				{#each PERFORMER_TYPES as type (type)}
					<option value={type}>{type}</option>
				{/each}
			</select>
		</div>
		<TextField
			id="performerGenre"
			label="Genre"
			bind:value={formState.genre}
			placeholder="e.g., House, Techno, Hip Hop"
		/>
	</div>

	<!-- Contact -->
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<TextField
			id="performerEmail"
			label="Email"
			type="email"
			bind:value={formState.email}
			placeholder="performer@email.com"
		/>
		<TextField
			id="performerPhone"
			label="Phone"
			type="tel"
			bind:value={formState.phone}
			placeholder="+84 xxx xxx xxx"
		/>
	</div>

	<!-- Payment Details -->
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<TextField
			id="performerBankName"
			label="Bank Name"
			bind:value={formState.bankName}
			placeholder="e.g., Vietcombank"
		/>
		<TextField
			id="performerBankAccount"
			label="Account Number"
			bind:value={formState.bankAccountNumber}
			placeholder="Account number"
		/>
		<TextField
			id="performerIdDocument"
			label="ID Document"
			bind:value={formState.idDocument}
			placeholder="Passport / CCCD number"
		/>
		<TextField
			id="performerTaxId"
			label="Tax ID"
			bind:value={formState.taxId}
			placeholder="Tax code"
		/>
	</div>

	<div class="flex gap-3 justify-end pt-4 border-t border-blue-300">
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
			disabled={formState.isSubmitting}
			class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
		>
			{formState.isSubmitting ? 'Creating...' : 'Create Performer'}
		</button>
	</div>
</div>
