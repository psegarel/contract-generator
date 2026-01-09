import { db } from '$lib/config/firebase';
import {
	collection,
	getDocs,
	doc,
	setDoc,
	serverTimestamp,
	type Timestamp
} from 'firebase/firestore';
import type { Event } from '$lib/types/v2';
import type { ContractData } from '$lib/schemas/contract';
import type { EventPlanningContractData } from '$lib/schemas/eventPlanningContract';
import type { MigrationResult } from './migrateClients';

/**
 * V1 Service Contract (from Firestore)
 */
interface V1ServiceContract {
	id: string;
	contractData: ContractData;
	contractNumber: string;
	createdAt: Timestamp;
	ownerUid: string;
	locationId: string;
	paymentStatus: 'unpaid' | 'paid';
	paidAt: Timestamp | null;
}

/**
 * V1 Event Planning Contract (from Firestore)
 */
interface V1EventPlanningContract {
	id: string;
	contractData: EventPlanningContractData;
	contractNumber: string;
	createdAt: Timestamp;
	ownerUid: string;
	locationId: string;
	paymentDirection: 'receivable' | 'payable';
	paymentStatus: 'unpaid' | 'paid';
	paidAt: Timestamp | null;
}

/**
 * Helper: Group contracts by date and create deduplicated events
 */
interface ContractForEvent {
	id: string;
	eventDate: string;
	eventName: string;
	locationAddress: string;
	ownerUid: string;
	createdAt: Timestamp;
	contractValue: number;
	paymentDirection: 'receivable' | 'payable';
}

async function createDeduplicatedEvents(
	contracts: ContractForEvent[],
	dryRun: boolean
): Promise<{ eventMap: Map<string, string>; eventsCreated: number }> {
	const eventMap = new Map<string, string>(); // contractId → eventId
	const eventsByKey = new Map<string, { eventId: string; contractIds: string[]; name: string; dates: string[] }>();

	let eventsCreated = 0;

	// Helper: Check if a date is within 1 day of any existing dates
	function findMatchingEvent(eventDate: string): string | null {
		const targetDate = new Date(eventDate);

		for (const [key, event] of eventsByKey.entries()) {
			// Check if date is within 1 day of any date in this event
			for (const existingDate of event.dates) {
				const existing = new Date(existingDate);
				const diffDays = Math.abs((targetDate.getTime() - existing.getTime()) / (1000 * 60 * 60 * 24));

				if (diffDays <= 1) {
					return key;
				}
			}
		}

		return null;
	}

	for (const contract of contracts) {
		// Check if event already exists for this date range
		const matchingKey = findMatchingEvent(contract.eventDate);

		if (matchingKey) {
			// Add contract to existing event
			const existing = eventsByKey.get(matchingKey)!;
			existing.contractIds.push(contract.id);
			if (!existing.dates.includes(contract.eventDate)) {
				existing.dates.push(contract.eventDate);
			}
			eventMap.set(contract.id, existing.eventId);
		} else {
			// Create new event for this name + date
			const eventId = crypto.randomUUID();
			const eventKey = `${contract.eventName}_${eventId}`;

			const eventData = {
				ownerUid: contract.ownerUid,
				name: contract.eventName,
				eventType: null,
				description: null,
				locationAddress: contract.locationAddress,
				locationName: null,
				venueCounterpartyId: null,
				eventDate: contract.eventDate,
				startTime: null,
				endTime: null,
				setupDateTime: null,
				teardownDateTime: null,
				expectedAttendance: null,
				status: 'completed' as const,
				contractIds: [contract.id],
				internalNotes: 'Migrated from v1 contracts'
			};

			if (dryRun) {
				console.log(`Would create event "${eventData.name}" for date ${contract.eventDate}`);
				console.log(`  → Event ID: ${eventId}`);
				console.log(`  → Contracts: [${contract.id}]`);
			} else {
				const eventRef = doc(db, 'events', eventId);
				await setDoc(eventRef, {
					...eventData,
					createdAt: serverTimestamp(),
					updatedAt: serverTimestamp()
				});
				console.log(`✓ Created event "${eventData.name}" (${eventId})`);
			}

			eventsByKey.set(eventKey, {
				eventId,
				contractIds: [contract.id],
				name: contract.eventName,
				dates: [contract.eventDate]
			});
			eventMap.set(contract.id, eventId);
			eventsCreated++;
		}
	}

	// Update events with multiple contracts or dates
	for (const [_key, event] of eventsByKey.entries()) {
		if (event.contractIds.length > 1 || event.dates.length > 1) {
			const dateRange = event.dates.length > 1
				? `${event.dates.sort()[0]} to ${event.dates.sort()[event.dates.length - 1]}`
				: event.dates[0];

			if (dryRun) {
				console.log(`\nEvent "${event.name}" (${dateRange}) has ${event.contractIds.length} contracts:`);
				console.log(`  → Contracts: ${event.contractIds.join(', ')}`);
			} else {
				// Update event with all contract IDs
				const eventRef = doc(db, 'events', event.eventId);
				await setDoc(eventRef, {
					contractIds: event.contractIds,
					updatedAt: serverTimestamp()
				}, { merge: true });
				console.log(`✓ Updated event "${event.name}" (${dateRange}) with ${event.contractIds.length} contracts`);
			}
		}
	}

	return { eventMap, eventsCreated };
}

/**
 * Create all initial events from existing contracts (with date-based deduplication)
 *
 * @param dryRun - If true, log what would happen without writing to database
 * @returns Maps of contractId → eventId for both contract types
 */
export async function createInitialEvents(dryRun: boolean = true): Promise<{
	serviceEventMap: Map<string, string>;
	eventPlanningEventMap: Map<string, string>;
	serviceResult: MigrationResult;
	eventPlanningResult: MigrationResult;
}> {
	console.log('\n=== Create Initial Events (Date-Based Deduplication) ===');
	console.log(`Mode: ${dryRun ? 'DRY RUN (no writes)' : 'LIVE (writing to database)'}`);
	console.log('Source: service-contracts + event-planning-contracts collections');
	console.log('Destination: events collection');
	console.log('Strategy: Group contracts by date - 1 event per unique date\n');

	const startTime = Date.now();
	const allContracts: ContractForEvent[] = [];
	const errors: Array<{ id: string; error: string }> = [];

	// Collect all service contracts
	console.log('--- Collecting Service Contracts ---\n');
	try {
		const serviceSnapshot = await getDocs(collection(db, 'service-contracts'));
		console.log(`Found ${serviceSnapshot.size} service contracts\n`);

		for (const contractDoc of serviceSnapshot.docs) {
			try {
				const data = contractDoc.data();
				const contractData = data.contractData as ContractData;

				allContracts.push({
					id: contractDoc.id,
					eventDate: contractData.startDate,
					eventName: contractData.eventName || contractData.jobName,
					locationAddress: contractData.eventLocation,
					ownerUid: data.ownerUid as string,
					createdAt: data.createdAt as Timestamp,
					contractValue: contractData.netFee * (1 + contractData.taxRate / 100),
					paymentDirection: 'receivable'
				});
			} catch (error) {
				errors.push({
					id: contractDoc.id,
					error: error instanceof Error ? error.message : String(error)
				});
			}
		}
	} catch (error) {
		console.error('Error collecting service contracts:', error);
	}

	// Collect all event planning contracts
	console.log('--- Collecting Event Planning Contracts ---\n');
	try {
		const epSnapshot = await getDocs(collection(db, 'event-planning-contracts'));
		console.log(`Found ${epSnapshot.size} event planning contracts\n`);

		for (const contractDoc of epSnapshot.docs) {
			try {
				const data = contractDoc.data();
				const contractData = data.contractData as EventPlanningContractData;

				allContracts.push({
					id: contractDoc.id,
					eventDate: contractData.eventDate,
					eventName: contractData.eventName || contractData.eventType || 'Event Planning',
					locationAddress: contractData.eventVenue,
					ownerUid: data.ownerUid as string,
					createdAt: data.createdAt as Timestamp,
					contractValue: contractData.contractValueVND,
					paymentDirection: (data.paymentDirection as 'receivable' | 'payable') || 'receivable'
				});
			} catch (error) {
				errors.push({
					id: contractDoc.id,
					error: error instanceof Error ? error.message : String(error)
				});
			}
		}
	} catch (error) {
		console.error('Error collecting event planning contracts:', error);
	}

	console.log(`\n--- Creating Deduplicated Events ---`);
	console.log(`Total contracts: ${allContracts.length}`);
	console.log(`Grouping by date...\n`);

	// Create deduplicated events
	const { eventMap, eventsCreated } = await createDeduplicatedEvents(allContracts, dryRun);

	// Split the map into service and event planning
	const serviceEventMap = new Map<string, string>();
	const eventPlanningEventMap = new Map<string, string>();

	const serviceSnapshot = await getDocs(collection(db, 'service-contracts'));
	const serviceIds = new Set(serviceSnapshot.docs.map(d => d.id));

	for (const [contractId, eventId] of eventMap.entries()) {
		if (serviceIds.has(contractId)) {
			serviceEventMap.set(contractId, eventId);
		} else {
			eventPlanningEventMap.set(contractId, eventId);
		}
	}

	const duration = Date.now() - startTime;

	console.log('\n=== Event Creation Summary ===');
	console.log(`Total contracts processed: ${allContracts.length}`);
	console.log(`Events created: ${eventsCreated} (deduplicated by date)`);
	console.log(`Failed: ${errors.length}`);
	console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);

	if (errors.length > 0) {
		console.log('\nErrors:');
		errors.forEach(({ id, error }) => {
			console.log(`  - ${id}: ${error}`);
		});
	}

	if (dryRun) {
		console.log('\n⚠️  DRY RUN COMPLETE - No data was written to the database');
	} else {
		console.log('\n✓ EVENT CREATION COMPLETE');
	}

	console.log('==========================\n');

	return {
		serviceEventMap,
		eventPlanningEventMap,
		serviceResult: {
			total: serviceEventMap.size,
			successful: serviceEventMap.size,
			failed: 0,
			errors: [],
			duration
		},
		eventPlanningResult: {
			total: eventPlanningEventMap.size,
			successful: eventPlanningEventMap.size,
			failed: 0,
			errors: [],
			duration: 0
		}
	};
}
