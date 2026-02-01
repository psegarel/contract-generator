import type { Event, EventStatus } from '$lib/types/v2';

/**
 * Form state class for Event forms
 * Manages all form fields and provides initialization/reset methods
 */
export class EventFormState {
	// UI state
	isSubmitting = $state(false);
	error = $state<string | null>(null);

	// Basic information
	name = $state('');
	eventType = $state('');
	description = $state('');
	status = $state<EventStatus>('planning');

	// Location
	locationAddress = $state('');
	locationName = $state('');
	venueCounterpartyId = $state('');

	// Date & Time
	eventDate = $state('');
	startTime = $state('');
	endTime = $state('');
	setupDateTime = $state('');
	teardownDateTime = $state('');
	expectedAttendance = $state<number | ''>('');

	// Notes
	internalNotes = $state('');

	/**
	 * Initialize form state from an event
	 */
	init(event: Event | null) {
		if (!event) {
			this.reset();
			return;
		}

		// Load event data
		this.name = event.name;
		this.eventType = event.eventType || '';
		this.description = event.description || '';
		this.locationAddress = event.locationAddress;
		this.locationName = event.locationName || '';
		this.venueCounterpartyId = event.venueCounterpartyId || '';
		this.eventDate = event.eventDate;
		this.startTime = event.startTime || '';
		this.endTime = event.endTime || '';
		this.setupDateTime = event.setupDateTime || '';
		this.teardownDateTime = event.teardownDateTime || '';
		this.expectedAttendance = event.expectedAttendance || '';
		this.status = event.status;
		this.internalNotes = event.internalNotes || '';
	}

	/**
	 * Reset form to empty state
	 */
	reset() {
		this.name = '';
		this.eventType = '';
		this.description = '';
		this.locationAddress = '';
		this.locationName = '';
		this.venueCounterpartyId = '';
		this.eventDate = '';
		this.startTime = '';
		this.endTime = '';
		this.setupDateTime = '';
		this.teardownDateTime = '';
		this.expectedAttendance = '';
		this.status = 'planning';
		this.internalNotes = '';
		this.error = null;
		this.isSubmitting = false;
	}
}
