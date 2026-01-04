<script lang="ts">
	import type { PageData } from './$types';
	import { EventCard } from '$lib/components/v2';
	import { Button } from '$lib/components/ui/button';
	import { Calendar, Plus } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
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
		<Button href="/v2/events/new">
			<Plus class="w-4 h-4 mr-2" />
			New Event
		</Button>
	</div>

	<!-- Events Grid -->
	{#if data.events.length === 0}
		<div class="py-20 text-center text-muted-foreground">
			<Calendar class="h-16 w-16 mx-auto mb-4 opacity-50" />
			<h3 class="text-lg font-semibold mb-2">No events yet</h3>
			<p class="text-sm mb-6">Create your first event to get started</p>
			<Button href="/v2/events/new">
				<Plus class="w-4 h-4 mr-2" />
				Create Event
			</Button>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each data.events as event (event.id)}
				<EventCard {event} />
			{/each}
		</div>
	{/if}
</div>
