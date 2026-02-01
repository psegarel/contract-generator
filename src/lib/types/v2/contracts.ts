import type { BaseContract } from './base';

/**
 * Specific contract types extending BaseContract
 * Each type has additional fields specific to that contract kind
 *
 * Database: Each type stored in its own Firestore collection
 * TypeScript: All extend BaseContract for DRY UI components
 */

/**
 * Venue Rental Contract
 * - We rent a venue from a VenueCounterparty
 * - Always payable (we pay the venue)
 */
export interface VenueRentalContract extends BaseContract {
	type: 'venue-rental';
	paymentDirection: 'payable';

	// Rental specifics
	rentalStartDateTime: string; // ISO datetime
	rentalEndDateTime: string;
	securityDeposit: number;
	securityDepositReturned: boolean;

	// Venue capacity & setup
	expectedAttendance: number;
	setupRequirements: string | null;

	// Terms
	cancellationPolicy: string | null;
}

/**
 * Performer Booking Contract
 * - We book a performer (can be payable or receivable)
 * - Payable: We hire performer for our event
 * - Receivable: We provide performer to client
 */
export interface PerformerBookingContract extends BaseContract {
	type: 'performer-booking';

	// Performance details
	performanceDate: string; // ISO date
	performanceStartTime: string;
	performanceDuration: number; // minutes

	// Requirements
	technicalRequirements: string | null;
	rehearsalDateTime: string | null;
	soundCheckDateTime: string | null;

	// Content
	setList: string | null;
	specialRequests: string | null;
}

/**
 * Equipment Rental Contract
 * - Can be incoming (we rent from supplier) or outgoing (we rent to client)
 */
export interface EquipmentRentalContract extends BaseContract {
	type: 'equipment-rental';

	// Rental period
	rentalStartDate: string;
	rentalEndDate: string;

	// Equipment list
	equipment: EquipmentItem[];

	// Rent
	monthlyRent: number;

	// Terms
	securityDeposit: number;
	damageWaiver: boolean;
	deliveryFee: number;

	// Logistics (empty string instead of null for Firestore compatibility)
	venueName: string;
	venueNameEnglish: string;
	venueAddress: string;
	venueAddressEnglish: string;
}

export interface EquipmentItem {
	name: string;
	quantity: number;
	unitPrice: number;
	serialNumbers: string[]; // Track specific items
}

/**
 * Service Provision Contract
 * - We pay service providers for services (payable)
 * - This maps to the old SavedServiceContract
 */
export interface ServiceProvisionContract extends BaseContract {
	type: 'service-provision';
	paymentDirection: 'payable';

	// Service details (from old ContractData schema)
	jobName: string;
	jobContent: string;
	numberOfPerformances: number;
	firstPerformanceTime: string;

	// Dates
	startDate: string;
	endDate: string;

	// Tax
	taxRate: number; // VAT percentage
	netFee: number; // Amount after tax has been deducted (what provider receives)

	// Status (from old system)
	status: 'draft' | 'generated';

	// Banking (from old system)
	bankName: string;
	accountNumber: string;

	// Client details (from old system - for PDF generation)
	clientEmail: string;
	clientAddress: string;
	clientPhone: string;
	clientIdDocument: string;
	clientTaxId: string | null;

	// Event location (from old system)
	eventLocation: string;
}

/**
 * Event Planning Contract
 * - We organize entire event for client (receivable)
 * - This maps to the old SavedEventPlanningContract
 */
export interface EventPlanningContract extends BaseContract {
	type: 'event-planning';
	paymentDirection: 'receivable';

	// From old EventPlanningContractData schema
	contractDate: string;
	contractLocation: string;

	// Client info (from old schema)
	clientCompany: string;
	clientAddress: string;
	clientTaxCode: string;
	clientRepresentativeName: string;
	clientRepresentativePosition: string;

	// Event info (from old schema)
	eventTheme: string | null;
	eventType: string | null;
	eventDescription: string | null;
	eventVenue: string;
	eventDate: string;
	eventDuration: string | null;
	expectedAttendance: string | null;

	// Financial terms
	contractValueVND: number; // Duplicate of contractValue, kept for compatibility
	vatRate: number;
	depositPercentage: number;
	finalPaymentPercentage: number;
	professionalIndemnityAmount: number;
	publicLiabilityAmount: number;

	// Timeline
	planningMeetingDays: number;
	performerBookingDeadline: string;
	technicalSetupDate: string;
	eventExecutionDate: string;
	setupCommencementTime: string;
	eventExecutionDuration: string;
	breakdownCompletionDateTime: string;

	// Legal
	paymentGracePeriodDays: number;
	terminationNoticeDays: number;
	negotiationPeriodDays: number;
	arbitrationLocation: string;
	arbitrationLanguage: string;
}

/**
 * Subcontractor Contract
 * - We hire external service provider (payable)
 */
export interface SubcontractorContract extends BaseContract {
	type: 'subcontractor';
	paymentDirection: 'payable';

	// Service scope
	serviceDescription: string;
	deliverables: string[];

	// Timeline
	startDate: string;
	completionDate: string;

	// Terms
	paymentTerms: string; // e.g., "50% upfront, 50% on completion"
	terminationClause: string | null;
}

/**
 * Generic Client Service Contract
 * - Catch-all for other receivable contracts
 */
export interface ClientServiceContract extends BaseContract {
	type: 'client-service';
	paymentDirection: 'receivable';

	serviceDescription: string;
	deliverables: string[];
	startDate: string;
	endDate: string;
}

/**
 * Union type for all contract types
 */
export type Contract =
	| VenueRentalContract
	| PerformerBookingContract
	| EquipmentRentalContract
	| ServiceProvisionContract
	| EventPlanningContract
	| SubcontractorContract
	| ClientServiceContract;
