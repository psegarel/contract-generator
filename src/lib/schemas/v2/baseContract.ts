import { z } from 'zod';

/**
 * Base contract schema - common fields for all contract types
 * Use this with .merge() to create specific contract schemas
 */
export const baseContractSchema = z.object({
	// Identity (id, createdAt, updatedAt added by Firestore)
	type: z.enum([
		'venue-rental',
		'performer-booking',
		'equipment-rental',
		'service-provision',
		'event-planning',
		'subcontractor',
		'client-service',
		'dj-residency'
	]),
	contractNumber: z.string().min(1, 'Contract number is required'),

	// Ownership
	ownerUid: z.string().min(1, 'Owner UID is required'),

	// Relationships
	eventId: z.string().nullable().optional(), // Optional - some contracts are standalone
	counterpartyId: z.string().min(1, 'Counterparty ID is required'),

	// Denormalized fields (cached for list performance)
	counterpartyName: z.string().min(1, 'Counterparty name is required'),
	eventName: z.string().nullable().optional(), // Optional - null if no event (matches TypeScript interface)

	// Payment
	paymentDirection: z.enum(['receivable', 'payable']),
	paymentStatus: z.enum(['unpaid', 'paid']),
	contractValue: z.number().min(0, 'Contract value must be positive'),
	currency: z.literal('VND'),

	// Payment audit trail
	paidAt: z.any().nullable().optional(),
	paidBy: z.string().nullable().optional(),

	// Metadata
	notes: z.string().nullable().optional()
});

/**
 * Base contract input schema (for creation)
 * Omits fields that are added by Firestore or on save
 */
export const baseContractInputSchema = baseContractSchema.omit({
	paidAt: true,
	paidBy: true
});

export type BaseContractInput = z.infer<typeof baseContractInputSchema>;
