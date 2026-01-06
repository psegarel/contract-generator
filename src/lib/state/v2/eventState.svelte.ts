import { subscribeToEvents } from '$lib/utils/v2/events';
import type { Event } from '$lib/types/v2';
import type { Unsubscribe } from 'firebase/firestore';

export class EventState {
	events = $state<Event[]>([]);
	isLoading = $state(false);
	error = $state<string | null>(null);
	private unsubscribe: Unsubscribe | null = null;

	init() {
		if (this.unsubscribe) return;
		this.isLoading = true;

		try {
			this.unsubscribe = subscribeToEvents(
				(events) => {
					this.events = events;
					this.isLoading = false;
					this.error = null;
				},
				(err) => {
					this.error = err.message;
					this.isLoading = false;
				}
			);
		} catch (e) {
			console.error('Failed to init event subscription', e);
			this.error = (e as Error).message;
			this.isLoading = false;
		}
	}

	destroy() {
		if (this.unsubscribe) {
			this.unsubscribe();
			this.unsubscribe = null;
		}
	}

	/**
	 * Get events by status
	 */
	getByStatus(status: Event['status']): Event[] {
		return this.events.filter((e) => e.status === status);
	}

	/**
	 * Get upcoming events
	 */
	get upcoming(): Event[] {
		const now = new Date().toISOString().split('T')[0];
		return this.events.filter((e) => e.eventDate >= now && e.status !== 'cancelled');
	}

	/**
	 * Get past events
	 */
	get past(): Event[] {
		const now = new Date().toISOString().split('T')[0];
		return this.events.filter((e) => e.eventDate < now);
	}

	/**
	 * Get event by ID
	 */
	getById(eventId: string): Event | undefined {
		return this.events.find((e) => e.id === eventId);
	}
}

export const eventState = new EventState();
