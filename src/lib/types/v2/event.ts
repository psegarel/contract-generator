import type { Timestamp } from 'firebase/firestore';

/**
 * Event status
 */
export type EventStatus =
	| 'planning' // Event being planned
	| 'confirmed' // All contracts signed
	| 'in-progress' // Event happening now
	| 'completed' // Event finished
	| 'cancelled'; // Event cancelled

/**
 * Event - central entity grouping related contracts
 *
 * An event can have multiple contracts:
 * - Venue rental contract (payable)
 * - Performer booking contracts (payable)
 * - Client service contract (receivable)
 * - Equipment rental contracts (payable/receivable)
 *
 * OR an event can be a simple single-service engagement with just one contract.
 *
 * The event provides the context that ties contracts together.
 */
export interface Event {
	id: string;
	ownerUid: string;
	createdAt: Timestamp;
	updatedAt: Timestamp;

	// Event identity
	name: string; // e.g., "ABC Corp Annual Gala 2026"
	eventType: string | null; // e.g., "Corporate Event", "Wedding", "Concert"
	description: string | null;

	// Location (simplified - no separate Location entity)
	locationAddress: string; // Always store address (e.g., "123 Main St, Saigon")
	locationName: string | null; // Optional venue name (e.g., "Grand Ballroom")
	venueCounterpartyId: string | null; // Only when venue is contracted party

	// Timing
	eventDate: string; // ISO date
	startTime: string | null;
	endTime: string | null;
	setupDateTime: string | null; // When setup begins
	teardownDateTime: string | null; // When teardown completes

	// Scale
	expectedAttendance: number | null;

	// Status
	status: EventStatus;

	// Contract relationships (denormalized for query performance)
	contractIds: string[]; // Array of contract IDs for this event

	// Financial summary (computed from contracts)
	totalReceivable: number; // Sum of all receivable contracts
	totalPayable: number; // Sum of all payable contracts
	netRevenue: number; // totalReceivable - totalPayable

	// Notes
	internalNotes: string | null;
}

/**
 * Event input type (for creation)
 */
export type EventInput = Omit<
	Event,
	| 'id'
	| 'createdAt'
	| 'updatedAt'
	| 'contractIds'
	| 'totalReceivable'
	| 'totalPayable'
	| 'netRevenue'
>;
