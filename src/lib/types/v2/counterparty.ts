import type { Timestamp } from 'firebase/firestore';

/**
 * Counterparty type discriminators
 */
export type CounterpartyType = 'venue' | 'performer' | 'service-provider' | 'client' | 'supplier';

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
	name: string; // "Grand Ballroom" or "DJ Smith" or "ABC Corp"
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
 * Venue - a business entity with physical location and billing info
 * Used when we contract WITH a venue (we rent their space)
 */
export interface VenueCounterparty extends BaseCounterparty {
	type: 'venue';

	// Venue-specific fields
	venueName: string; // e.g., "Grand Ballroom" (may differ from business name)
	venueAddress: string; // Physical venue location
	ownerCompany: string | null; // e.g., "XYZ Entertainment Ltd"

	// Business & billing
	taxCode: string;
	bankName: string | null;
	bankAccountNumber: string | null;
	representativeName: string | null;
	representativePosition: string | null;

	// Venue details
	venueCapacity: number | null;
	venueType: string | null; // e.g., "Conference Hall", "Outdoor Space"
	amenities: string[]; // e.g., ["Parking", "WiFi", "Catering Kitchen"]
}

/**
 * Performer - individual or group providing entertainment
 */
export interface PerformerCounterparty extends BaseCounterparty {
	type: 'performer';

	// Performer details
	stageName: string; // May differ from legal name
	performerType: string; // e.g., "Band", "DJ", "MC", "Dancer"
	genre: string | null;

	// Performance requirements
	technicalRider: string | null; // Equipment/setup requirements
	minPerformanceDuration: number | null; // minutes
	travelRequirements: string | null;

	// Booking details
	agentName: string | null;
	agentContact: string | null;
}

/**
 * Service Provider - company/individual providing services
 * (e.g., catering, photography, security, AV subcontractor)
 */
export interface ServiceProviderCounterparty extends BaseCounterparty {
	type: 'service-provider';

	// Service details
	serviceType: string; // e.g., "Catering", "Photography", "Security", "AV Equipment"
	companyName: string | null;

	// Deliverables
	typicalDeliverables: string[]; // e.g., ["200 meals", "4 hours coverage"]
	equipmentProvided: string[]; // e.g., ["Cameras", "Lighting rig"]

	// Business info
	businessLicense: string | null;
	insuranceInfo: string | null;
}

/**
 * Client - entity that hires us
 * Replaces the old ClientData type
 */
export interface ClientCounterparty extends BaseCounterparty {
	type: 'client';

	// Client type
	clientType: 'individual' | 'company';

	// Company details (if applicable)
	companyName: string | null;
	representativeName: string | null;
	representativePosition: string | null;

	// ID documents (for individuals)
	idDocument: string | null; // Passport/ID number

	// Tax info
	taxId: string | null;

	// Banking (for invoicing)
	bankName: string | null;
	bankAccountNumber: string | null;
}

/**
 * Supplier - entity that supplies equipment/goods
 */
export interface SupplierCounterparty extends BaseCounterparty {
	type: 'supplier';

	companyName: string;
	productCategories: string[]; // e.g., ["Audio Equipment", "Lighting"]
	paymentTerms: string | null; // e.g., "Net 30"
	deliveryOptions: string[]; // e.g., ["Pickup", "Delivery"]
}

/**
 * Union type for type-safe handling
 */
export type Counterparty =
	| VenueCounterparty
	| PerformerCounterparty
	| ServiceProviderCounterparty
	| ClientCounterparty
	| SupplierCounterparty;
