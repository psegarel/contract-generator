<script lang="ts">
	import TextField from '$lib/components/TextField.svelte';
	import SelectField from '$lib/components/SelectField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import type { EventFormState } from '$lib/state/v2/eventFormState.svelte';

	interface VenueOption {
		id: string;
		name: string;
	}

	let {
		formState,
		venues
	}: {
		formState: EventFormState;
		venues: VenueOption[];
	} = $props();
</script>

<FormSection title="Location">
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<TextField
			id="locationAddress"
			label="Location Address"
			bind:value={formState.locationAddress}
			required
			placeholder="123 Main St, Ho Chi Minh City"
			class="col-span-full"
		/>

		<TextField
			id="locationName"
			label="Location Name"
			bind:value={formState.locationName}
			placeholder="Grand Ballroom"
		/>

		<SelectField
			id="venueCounterpartyId"
			label="Venue Counterparty (if contracted)"
			bind:value={formState.venueCounterpartyId}
		>
			<option value="">None (simple address)</option>
			{#each venues as venue (venue.id)}
				<option value={venue.id}>{venue.name}</option>
			{/each}
		</SelectField>
	</div>
</FormSection>
