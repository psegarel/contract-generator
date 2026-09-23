import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	buildEventInput,
	saveEventForm,
	toInlineEventFormValues,
	type EventFormValues
} from './event';

const mocks = vi.hoisted(() => ({
	saveEvent: vi.fn(),
	updateEvent: vi.fn()
}));

vi.mock('$lib/utils/v2/events', () => ({
	saveEvent: mocks.saveEvent,
	updateEvent: mocks.updateEvent
}));

const values: EventFormValues = {
	name: 'Corporate Gala Dinner',
	eventType: 'Corporate Event',
	description: 'Annual company dinner',
	locationAddress: 'Ho Chi Minh City',
	locationName: 'Grand Ballroom',
	venueCounterpartyId: 'venue-1',
	eventDate: '2026-10-10',
	startTime: '18:00',
	endTime: '22:00',
	setupDateTime: '2026-10-10T14:00',
	teardownDateTime: '2026-10-10T23:00',
	expectedAttendance: 200,
	status: 'planning',
	internalNotes: ''
};

describe('event form workflow', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('builds the persisted input from form values', () => {
		expect(buildEventInput(values, 'owner-1')).toEqual({
			ownerUid: 'owner-1',
			name: values.name,
			eventType: values.eventType,
			description: values.description,
			locationAddress: values.locationAddress,
			locationName: values.locationName,
			venueCounterpartyId: values.venueCounterpartyId,
			eventDate: values.eventDate,
			startTime: values.startTime,
			endTime: values.endTime,
			setupDateTime: values.setupDateTime,
			teardownDateTime: values.teardownDateTime,
			expectedAttendance: values.expectedAttendance,
			status: values.status,
			internalNotes: null
		});
	});

	it('maps inline event values to the full form shape', () => {
		expect(
			toInlineEventFormValues({
				name: 'Inline Event',
				eventDate: '2026-10-10',
				eventType: 'Gala',
				description: '',
				locationAddress: 'HCMC',
				locationName: '',
				expectedAttendance: null
			})
		).toMatchObject({ name: 'Inline Event', status: 'planning', expectedAttendance: '' });
	});

	it('rejects unauthenticated submissions before persistence', async () => {
		await expect(saveEventForm({ values, ownerUid: null })).rejects.toThrow(
			'You must be logged in to create an event'
		);
		expect(mocks.saveEvent).not.toHaveBeenCalled();
	});

	it('saves a valid new event', async () => {
		mocks.saveEvent.mockResolvedValue('event-1');

		await expect(saveEventForm({ values, ownerUid: 'owner-1' })).resolves.toBe('event-1');
		expect(mocks.saveEvent).toHaveBeenCalledWith(buildEventInput(values, 'owner-1'));
	});
});
