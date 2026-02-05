import { z } from 'zod';
import type { Timestamp } from 'firebase/firestore';

/**
 * Base counterparty schema - common fields for all counterparty types
 */
export const baseCounterpartySchema = z.object({
	// Identity
	type: z.enum(['venue', 'performer', 'service-provider', 'client', 'supplier']),

	// Common fields for list display
	name: z.string().min(1, 'Name is required'),
	email: z.string().email('Invalid email').nullable().optional(),
	phone: z.string().nullable().optional(),
	address: z.string().nullable().optional(),

	// Ownership
	ownerUid: z.string().min(1, 'Owner UID is required'),

	// Metadata
	notes: z.string().nullable().optional(),

	// Timestamps (required - forms use Timestamp.now(), server replaces with serverTimestamp())
	createdAt: z.custom<Timestamp>(),
	updatedAt: z.custom<Timestamp>()
});

/**
 * Venue counterparty schema
 */
export const venueCounterpartySchema = baseCounterpartySchema
	.extend({
		type: z.literal('venue'),

		// Venue-specific fields
		venueName: z.string().min(1, 'Venue name is required'),
		venueAddress: z.string().min(1, 'Venue address is required'),
		ownerCompany: z.string().nullable().optional(),

		// Business & billing
		taxCode: z.string().nullable().optional(),
		bankName: z.string().nullable().optional(),
		bankAccountNumber: z.string().nullable().optional(),
		representativeName: z.string().nullable().optional(),
		representativePosition: z.string().nullable().optional(),

		// Venue details
		venueCapacity: z.number().nullable().optional(),
		venueType: z.string().nullable().optional(),
		amenities: z.array(z.string()).default([])
	})
	.strict();

/**
 * Performer counterparty schema
 */
export const performerCounterpartySchema = baseCounterpartySchema
	.extend({
		type: z.literal('performer'),

		// Performer details
		stageName: z.string().min(1, 'Stage name is required'),
		performerType: z.string().min(1, 'Performer type is required'),
		genre: z.string().nullable().optional(),

		// Performance requirements
		technicalRider: z.string().nullable().optional(),
		minPerformanceDuration: z.number().nullable().optional(),
		travelRequirements: z.string().nullable().optional(),

		// Booking details
		agentName: z.string().nullable().optional(),
		agentContact: z.string().nullable().optional(),

		// Payment details (needed for DJ Residency invoicing)
		bankName: z.string().nullable().optional(),
		bankAccountNumber: z.string().nullable().optional(),
		idDocument: z.string().nullable().optional(),
		taxId: z.string().nullable().optional()
	})
	.strict();

/**
 * Service Provider counterparty schema
 */
export const serviceProviderCounterpartySchema = baseCounterpartySchema
	.extend({
		type: z.literal('service-provider'),

		// Service details
		serviceType: z.string().min(1, 'Service type is required'),
		companyName: z.string().nullable().optional(),

		// Deliverables
		typicalDeliverables: z.array(z.string()).default([]),
		equipmentProvided: z.array(z.string()).default([]),

		// Business info
		businessLicense: z.string().nullable().optional(),
		insuranceInfo: z.string().nullable().optional(),

		// Tax & banking (same as client)
		taxId: z.string().nullable().optional(),
		bankName: z.string().nullable().optional(),
		bankAccountNumber: z.string().nullable().optional(),
		idDocument: z.string().nullable().optional()
	})
	.strict();

/**
 * Client counterparty schema
 */
export const clientCounterpartySchema = baseCounterpartySchema
	.extend({
		type: z.literal('client'),

		// Client type
		clientType: z.enum(['individual', 'company']),

		// Company details
		companyName: z.string().nullable().optional(),
		representativeName: z.string().nullable().optional(),
		representativePosition: z.string().nullable().optional(),

		// ID documents
		idDocument: z.string().nullable().optional(),

		// Tax info
		taxId: z.string().nullable().optional(),

		// Banking
		bankName: z.string().nullable().optional(),
		bankAccountNumber: z.string().nullable().optional()
	})
	.strict();

/**
 * Supplier counterparty schema
 */
export const supplierCounterpartySchema = baseCounterpartySchema
	.extend({
		type: z.literal('supplier'),

		companyName: z.string().min(1, 'Company name is required'),
		productCategories: z.array(z.string()).min(1, 'At least one product category is required'),
		paymentTerms: z.string().nullable().optional(),
		deliveryOptions: z.array(z.string()).default([])
	})
	.strict();

/**
 * List schema - validates common fields, preserves type-specific fields
 * Uses .passthrough() so fields like stageName, performerType etc. survive validation
 */
export const counterpartyListSchema = baseCounterpartySchema.passthrough();

/**
 * Union schema for all counterparty types
 */
export const counterpartySchema = z.discriminatedUnion('type', [
	venueCounterpartySchema,
	performerCounterpartySchema,
	serviceProviderCounterpartySchema,
	clientCounterpartySchema,
	supplierCounterpartySchema
]);

/**
 * TypeScript types inferred from schemas
 */
export type CounterpartyListItem = z.infer<typeof counterpartyListSchema>;
export type VenueCounterpartyInput = z.infer<typeof venueCounterpartySchema>;
export type PerformerCounterpartyInput = z.infer<typeof performerCounterpartySchema>;
export type ServiceProviderCounterpartyInput = z.infer<typeof serviceProviderCounterpartySchema>;
export type ClientCounterpartyInput = z.infer<typeof clientCounterpartySchema>;
export type SupplierCounterpartyInput = z.infer<typeof supplierCounterpartySchema>;
export type CounterpartyInput = z.infer<typeof counterpartySchema>;
