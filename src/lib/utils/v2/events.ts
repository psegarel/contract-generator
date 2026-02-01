import {
	collection,
	addDoc,
	getDocs,
	getDoc,
	doc,
	updateDoc,
	query,
	where,
	orderBy,
	serverTimestamp,
	onSnapshot,
	deleteDoc,
	type Unsubscribe
} from 'firebase/firestore';
import { db } from '$lib/config/firebase';
import type { Event, EventInput } from '$lib/types/v2';
import { eventInputSchema } from '$lib/schemas/v2';
import { logger } from '../logger';

const COLLECTION_NAME = 'events';

/**
 * Subscribe to events (real-time updates)
 */
export function subscribeToEvents(
	callback: (events: Event[]) => void,
	onError: (error: Error) => void
): Unsubscribe {
	const q = query(collection(db, COLLECTION_NAME), orderBy('eventDate', 'desc'));

	return onSnapshot(
		q,
		(snapshot) => {
			const events = snapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data()
			})) as Event[];
			callback(events);
		},
		(error) => {
			logger.error('Error in events subscription:', error);
			onError(error);
		}
	);
}

/**
 * Save a new event
 */
export async function saveEvent(eventData: EventInput): Promise<string> {
	try {
		const validationResult = eventInputSchema.safeParse(eventData);
		if (!validationResult.success) {
			logger.error('Validation error:', validationResult.error);
			throw new Error('Invalid event data: ' + validationResult.error.message);
		}

		const toWrite = {
			...eventData,
			contractIds: [],
			totalReceivable: 0,
			totalPayable: 0,
			netRevenue: 0,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp()
		};

		const docRef = await addDoc(collection(db, COLLECTION_NAME), toWrite);
		return docRef.id;
	} catch (error) {
		logger.error('Error saving event:', error);
		throw new Error('Failed to save event');
	}
}

/**
 * Get event by ID
 */
export async function getEventById(eventId: string): Promise<Event | null> {
	try {
		const docRef = doc(db, COLLECTION_NAME, eventId);
		const docSnap = await getDoc(docRef);

		if (!docSnap.exists()) {
			return null;
		}

		return {
			id: docSnap.id,
			...docSnap.data()
		} as Event;
	} catch (error) {
		logger.error('Error fetching event:', error);
		throw new Error('Failed to fetch event');
	}
}

/**
 * Get all events
 */
export async function getEvents(): Promise<Event[]> {
	try {
		const q = query(collection(db, COLLECTION_NAME), orderBy('eventDate', 'desc'));
		const querySnapshot = await getDocs(q);

		return querySnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data()
		})) as Event[];
	} catch (error) {
		logger.error('Error fetching events:', error);
		throw new Error('Failed to fetch events');
	}
}

/**
 * Get events by owner
 */
export async function getEventsByOwner(ownerUid: string): Promise<Event[]> {
	try {
		const q = query(
			collection(db, COLLECTION_NAME),
			where('ownerUid', '==', ownerUid),
			orderBy('eventDate', 'desc')
		);

		const querySnapshot = await getDocs(q);
		return querySnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data()
		})) as Event[];
	} catch (error) {
		logger.error('Error fetching events by owner:', error);
		throw new Error('Failed to fetch events');
	}
}

/**
 * Update event
 */
export async function updateEvent(eventId: string, updates: Partial<Event>): Promise<void> {
	try {
		const docRef = doc(db, COLLECTION_NAME, eventId);

		const docSnap = await getDoc(docRef);
		if (!docSnap.exists()) {
			throw new Error('Event not found');
		}

		await updateDoc(docRef, {
			...updates,
			updatedAt: serverTimestamp()
		});
	} catch (error) {
		logger.error('Error updating event:', error);
		throw new Error('Failed to update event');
	}
}

/**
 * Add contract to event and recalculate financials
 */
export async function addContractToEvent(
	eventId: string,
	contractId: string,
	contractValue: number,
	paymentDirection: 'receivable' | 'payable'
): Promise<void> {
	try {
		const eventDoc = await getEventById(eventId);
		if (!eventDoc) {
			throw new Error('Event not found');
		}

		const contractIds = [...eventDoc.contractIds, contractId];
		const totalReceivable =
			paymentDirection === 'receivable'
				? eventDoc.totalReceivable + contractValue
				: eventDoc.totalReceivable;
		const totalPayable =
			paymentDirection === 'payable'
				? eventDoc.totalPayable + contractValue
				: eventDoc.totalPayable;
		const netRevenue = totalReceivable - totalPayable;

		await updateEvent(eventId, {
			contractIds,
			totalReceivable,
			totalPayable,
			netRevenue
		});
	} catch (error) {
		logger.error('Error adding contract to event:', error);
		throw new Error('Failed to add contract to event');
	}
}

/**
 * Remove contract from event and recalculate financials
 */
export async function removeContractFromEvent(
	eventId: string,
	contractId: string,
	contractValue: number,
	paymentDirection: 'receivable' | 'payable'
): Promise<void> {
	try {
		const eventDoc = await getEventById(eventId);
		if (!eventDoc) {
			throw new Error('Event not found');
		}

		const contractIds = eventDoc.contractIds.filter((id) => id !== contractId);
		const totalReceivable =
			paymentDirection === 'receivable'
				? eventDoc.totalReceivable - contractValue
				: eventDoc.totalReceivable;
		const totalPayable =
			paymentDirection === 'payable'
				? eventDoc.totalPayable - contractValue
				: eventDoc.totalPayable;
		const netRevenue = totalReceivable - totalPayable;

		await updateEvent(eventId, {
			contractIds,
			totalReceivable,
			totalPayable,
			netRevenue
		});
	} catch (error) {
		logger.error('Error removing contract from event:', error);
		throw new Error('Failed to remove contract from event');
	}
}

/**
 * Delete event
 */
export async function deleteEvent(eventId: string): Promise<void> {
	try {
		const docRef = doc(db, COLLECTION_NAME, eventId);
		await deleteDoc(docRef);
	} catch (error) {
		logger.error('Error deleting event:', error);
		throw new Error('Failed to delete event');
	}
}
