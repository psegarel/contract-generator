import { z } from 'zod';
import type { Timestamp } from 'firebase/firestore';

/**
 * Document metadata schema
 */
const documentMetadataSchema = z.object({
	url: z.string().url('Invalid URL'),
	fileName: z.string().min(1, 'File name is required'),
	uploadedAt: z.custom<Date>(),
	uploadedBy: z.string().min(1, 'Uploader UID is required'),
	size: z.number().min(0, 'File size must be positive')
});

/**
 * Counterparty documents schema (multiple images)
 */
const counterpartyDocumentsSchema = z
	.object({
		image1: documentMetadataSchema.optional(),
		image2: documentMetadataSchema.optional(),
		image3: documentMetadataSchema.optional(),
		image4: documentMetadataSchema.optional(),
		image5: documentMetadataSchema.optional()
	})
	.optional();

/**
 * Base counterparty schema - common fields for all counterparty types
 */
export const baseCounterpartySchema = z.object({
	// Identity
	type: z.enum(['client', 'contractor']),

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
 * Performer contractor schema
 */
export const performerContractorSchema = baseCounterpartySchema
	.extend({
		type: z.literal('contractor'),
		contractorType: z.literal('performer'),

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

		// Payment details
		bankName: z.string().nullable().optional(),
		bankAccountNumber: z.string().nullable().optional(),
		idDocument: z.string().nullable().optional(),
		taxId: z.string().nullable().optional(),

		// ID document images
		documents: counterpartyDocumentsSchema
	})
	.strict();

/**
 * Service Provider contractor schema
 */
export const serviceProviderContractorSchema = baseCounterpartySchema
	.extend({
		type: z.literal('contractor'),
		contractorType: z.literal('service-provider'),

		// Service details
		serviceType: z.string().min(1, 'Service type is required'),
		companyName: z.string().nullable().optional(),

		// Deliverables
		typicalDeliverables: z.array(z.string()).default([]),
		equipmentProvided: z.array(z.string()).default([]),

		// Business info
		businessLicense: z.string().nullable().optional(),
		insuranceInfo: z.string().nullable().optional(),

		// Tax & banking
		taxId: z.string().nullable().optional(),
		bankName: z.string().nullable().optional(),
		bankAccountNumber: z.string().nullable().optional(),
		idDocument: z.string().nullable().optional(),

		// ID document images
		documents: counterpartyDocumentsSchema
	})
	.strict();

/**
 * Contractor schema (union of performer and service-provider)
 */
export const contractorCounterpartySchema = z.discriminatedUnion('contractorType', [
	performerContractorSchema,
	serviceProviderContractorSchema
]);

/**
 * List schema - validates common fields plus optional contractor subtype
 */
export const counterpartyListSchema = baseCounterpartySchema.extend({
	clientType: z.enum(['individual', 'company']).optional(),
	contractorType: z.enum(['performer', 'service-provider']).optional()
});

/**
 * Union schema for all counterparty types
 *
 * Note: We can't use discriminatedUnion on 'type' here because both contractor subtypes
 * share type: 'contractor'. Instead we use a manual union with z.union.
 */
export const counterpartySchema = z.union([
	clientCounterpartySchema,
	performerContractorSchema,
	serviceProviderContractorSchema
]);

/**
 * TypeScript types inferred from schemas
 */
export type CounterpartyListItem = z.infer<typeof counterpartyListSchema>;
export type ClientCounterpartyInput = z.infer<typeof clientCounterpartySchema>;
export type PerformerContractorInput = z.infer<typeof performerContractorSchema>;
export type ServiceProviderContractorInput = z.infer<typeof serviceProviderContractorSchema>;
export type ContractorCounterpartyInput = z.infer<typeof contractorCounterpartySchema>;
export type CounterpartyInput = z.infer<typeof counterpartySchema>;
