import type { BaseContract } from '$lib/types/v2';
import type {
	EventPlanningContract,
	ServiceProvisionContract,
	VenueRentalContract,
	EquipmentRentalContract,
	PerformerBookingContract,
	SubcontractorContract,
	ClientServiceContract,
	DjResidencyContract
} from '$lib/types/v2/contracts';

/**
 * Get the relevant date for a contract (the actual contract/event date, not createdAt)
 * Returns the date as an ISO string, or null if no date field exists for the contract type
 */
export function getContractDate(contract: BaseContract): string | null {
	switch (contract.type) {
		case 'event-planning':
			return (contract as EventPlanningContract).eventDate;
		case 'service-provision':
			return (contract as ServiceProvisionContract).startDate;
		case 'venue-rental':
			// rentalStartDateTime is ISO datetime, extract date part
			const venueDate = (contract as VenueRentalContract).rentalStartDateTime;
			return venueDate ? venueDate.split('T')[0] : null;
		case 'equipment-rental':
			return (contract as EquipmentRentalContract).rentalStartDate;
		case 'performer-booking':
			return (contract as PerformerBookingContract).performanceDate;
		case 'subcontractor':
			return (contract as SubcontractorContract).startDate;
		case 'client-service':
			return (contract as ClientServiceContract).startDate;
		case 'dj-residency':
			return (contract as DjResidencyContract).contractStartDate;
		default:
			return null;
	}
}

/**
 * Get the contract date as a Date object, falling back to createdAt if no date field exists
 */
export function getContractDateOrCreatedAt(contract: BaseContract): Date {
	const contractDate = getContractDate(contract);
	if (contractDate) {
		return new Date(contractDate);
	}
	// Fallback to createdAt if no specific date field
	return contract.createdAt.toDate();
}
