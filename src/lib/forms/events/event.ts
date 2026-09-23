import type { Event, EventInput } from '$lib/types/v2';
import { eventInputSchema } from '$lib/schemas/v2/event';
import { saveEvent, updateEvent } from '$lib/utils/v2/events';

export interface EventFormValues {
	name: string;
	eventType: string;
	description: string;
	locationAddress: string;
	locationName: string;
	venueCounterpartyId: string;
	eventDate: string;
	startTime: string;
	endTime: string;
	setupDateTime: string;
	teardownDateTime: string;
	expectedAttendance: number | '';
	status: EventInput['status'];
	internalNotes: string;
}

interface SaveEventFormOptions {
	values: EventFormValues;
	ownerUid: string | null | undefined;
	event?: Event | null;
}

export function buildEventInput(values: EventFormValues, ownerUid: string): EventInput {
	return {
		ownerUid,
		name: values.name,
		eventType: values.eventType || null,
		description: values.description || null,
		locationAddress: values.locationAddress,
		locationName: values.locationName || null,
		venueCounterpartyId: values.venueCounterpartyId || null,
		eventDate: values.eventDate,
		startTime: values.startTime || null,
		endTime: values.endTime || null,
		setupDateTime: values.setupDateTime || null,
		teardownDateTime: values.teardownDateTime || null,
		expectedAttendance:
			typeof values.expectedAttendance === 'number' ? values.expectedAttendance : null,
		status: values.status,
		internalNotes: values.internalNotes || null
	};
}

export async function saveEventForm({
	values,
	ownerUid,
	event
}: SaveEventFormOptions): Promise<string> {
	if (!ownerUid) {
		throw new Error('You must be logged in to create an event');
	}

	const eventData = buildEventInput(values, ownerUid);
	const validationResult = eventInputSchema.safeParse(eventData);
	if (!validationResult.success) {
		throw new Error('Validation error: ' + validationResult.error.issues[0].message);
	}

	if (event) {
		await updateEvent(event.id, eventData);
		return event.id;
	}

	return saveEvent(eventData);
}
