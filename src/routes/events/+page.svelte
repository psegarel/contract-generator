<script lang="ts">
	import type { PageData } from './$types';
	import { EventsList } from '$lib/components/v2/events';
	import { Button } from '$lib/components/ui/button';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { Calendar, Plus } from '@lucide/svelte';
	import { serviceProvisionContractState, eventPlanningContractState } from '$lib/state/v2';

	let { data }: { data: PageData } = $props();

	// Initialize contract states so EventsList can calculate financials
	$effect(() => {
		serviceProvisionContractState.init();
		eventPlanningContractState.init();

		return () => {
			serviceProvisionContractState.destroy();
			eventPlanningContractState.destroy();
		};
	});
</script>

<div>
	<PageHeader
		title="Events"
		description={`${data.events.length} ${data.events.length === 1 ? 'event' : 'events'}`}
	>
		{#snippet icon()}
			<Calendar class="size-5" />
		{/snippet}
		{#snippet children()}
			<Button href="/events/new">
				<Plus class="size-4" />
				New Event
			</Button>
		{/snippet}
	</PageHeader>

	<!-- Events List -->
	<EventsList events={data.events} title="" showHeaders={true} />
</div>
