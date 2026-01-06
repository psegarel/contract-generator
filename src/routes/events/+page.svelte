<script lang="ts">
	import type { PageData } from './$types';
	import { EventsList } from '$lib/components/v2/events';
	import { Button } from '$lib/components/ui/button';
	import { Calendar, Plus } from 'lucide-svelte';
	import {
		serviceProvisionContractState,
		eventPlanningContractState
	} from '$lib/state/v2';

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

<div class="p-8">
	<!-- Header -->
	<div class="flex items-center justify-between mb-8">
		<div class="flex items-center gap-3">
			<div
				class="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"
			>
				<Calendar class="w-6 h-6" />
			</div>
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-foreground">Events</h1>
				<p class="text-muted-foreground mt-1 text-sm">
					{data.events.length} {data.events.length === 1 ? 'event' : 'events'}
				</p>
			</div>
		</div>
		<Button href="/events/new">
			<Plus class="w-4 h-4 mr-2" />
			New Event
		</Button>
	</div>

	<!-- Events List -->
	<EventsList events={data.events} title="" showHeaders={true} />
</div>
