import type { Timestamp } from 'firebase/firestore';

/**
 * Payment direction for contracts
 * - receivable: We receive payment (client/customer pays us)
 * - payable: We make payment (we pay vendor/performer)
 */
export type PaymentDirection = 'receivable' | 'payable';

/**
 * Payment status tracking
 */
export type PaymentStatus = 'unpaid' | 'paid';

/**
 * Contract type discriminators
 * Each type represents a different kind of business relationship
 */
export type ContractType =
	| 'venue-rental' // We rent a venue (payable)
	| 'performer-booking' // We book a performer (payable or receivable)
	| 'equipment-rental' // We rent equipment to/from someone
	| 'service-provision' // We provide AV/tech services (receivable)
	| 'event-planning' // We organize full event (receivable)
	| 'subcontractor' // We hire subcontractor (payable)
	| 'client-service' // Generic client service contract (receivable)
	| 'dj-residency'; // DJ residency framework agreement (receivable)

/**
 * Base contract interface - MINIMAL common fields for list display
 *
 * This is a contract generator, not a management system.
 * Goal: Avoid UI duplication when listing contracts.
 *
 * All contract types extend this base interface.
 * UI components can accept BaseContract and access common fields without type checking.
 */
export interface BaseContract {
	// Identity
	id: string;
	type: ContractType;
	contractNumber: string;

	// Ownership & timestamps
	ownerUid: string;
	createdAt: Timestamp;
	updatedAt: Timestamp;

	// Relationships
	eventId: string | null; // References Event document (null for standalone contracts)
	counterpartyId: string; // References Counterparty document

	// Denormalized for list performance (avoid extra fetches)
	counterpartyName: string; // Cached from counterparty.name
	eventName: string | null; // Cached from event.name (null if no event)

	// Payment tracking
	paymentDirection: PaymentDirection;
	paymentStatus: PaymentStatus;
	contractValue: number; // Always in VND
	currency: 'VND'; // Future: support multi-currency

	// Payment audit trail
	paidAt: Timestamp | null;
	paidBy: string | null; // User UID who marked as paid

	// Optional metadata
	notes: string | null; // Internal notes
}
