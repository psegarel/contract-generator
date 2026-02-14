import type { Timestamp } from 'firebase/firestore';

/**
 * Document metadata for uploaded images
 */
export type DocumentMetadata = {
	url: string;
	fileName: string;
	uploadedAt: Date;
	uploadedBy: string;
	size: number;
};

/**
 * Documents structure for counterparties (multiple images)
 */
export type CounterpartyDocuments = {
	image1?: DocumentMetadata;
	image2?: DocumentMetadata;
	image3?: DocumentMetadata;
	image4?: DocumentMetadata;
	image5?: DocumentMetadata;
};

/**
 * Top-level counterparty types (two-tier model)
 */
export type CounterpartyType = 'client' | 'contractor';

/**
 * Contractor subtypes
 */
export type ContractorType = 'performer' | 'service-provider';

/**
 * Client subtypes
 */
export type ClientType = 'individual' | 'company';

/**
 * Base counterparty - MINIMAL common fields for list display
 *
 * Goal: Keep UI DRY - list views use common fields only, no type checking needed.
 * Detail views can access type-specific fields via type narrowing.
 */
export interface BaseCounterparty {
	// Identity
	id: string;
	type: CounterpartyType;

	// Common fields for list display (ALL types must provide)
	name: string;
	email: string | null;
	phone: string | null;
	address: string | null;

	// Timestamps
	createdAt: Timestamp;
	updatedAt: Timestamp;
	ownerUid: string;

	// Optional metadata
	notes: string | null;
}

/**
 * Client - entity that hires us
 */
export interface ClientCounterparty extends BaseCounterparty {
	type: 'client';

	// Client subtype
	clientType: ClientType;

	// Company details (if applicable)
	companyName: string | null;
	representativeName: string | null;
	representativePosition: string | null;

	// ID documents (for individuals)
	idDocument: string | null;

	// Tax info
	taxId: string | null;

	// Banking (for invoicing)
	bankName: string | null;
	bankAccountNumber: string | null;
}

/**
 * Base fields shared by all contractor subtypes
 */
interface BaseContractorFields extends BaseCounterparty {
	type: 'contractor';

	// Payment details
	bankName: string | null;
	bankAccountNumber: string | null;
	idDocument: string | null;
	taxId: string | null;

	// ID document images
	documents?: CounterpartyDocuments;
}

/**
 * Performer contractor - individual or group providing entertainment
 */
export interface PerformerContractor extends BaseContractorFields {
	contractorType: 'performer';

	// Performer details
	stageName: string;
	performerType: string;
	genre: string | null;

	// Performance requirements
	technicalRider: string | null;
	minPerformanceDuration: number | null;
	travelRequirements: string | null;

	// Booking details
	agentName: string | null;
	agentContact: string | null;
}

/**
 * Service provider contractor - company/individual providing services
 */
export interface ServiceProviderContractor extends BaseContractorFields {
	contractorType: 'service-provider';

	// Service details
	serviceType: string;
	companyName: string | null;

	// Deliverables
	typicalDeliverables: string[];
	equipmentProvided: string[];

	// Business info
	businessLicense: string | null;
	insuranceInfo: string | null;
}

/**
 * Union of all contractor subtypes
 */
export type ContractorCounterparty = PerformerContractor | ServiceProviderContractor;

/**
 * Union type for type-safe handling
 */
export type Counterparty = ClientCounterparty | ContractorCounterparty;
