import type { PerformerContractor } from '$lib/types/v2';
import { companyConfig } from '$lib/config/company';

export class PerformerFormState {
	// Basic info
	name = $state('');
	stageName = $state('');
	email = $state('');
	phone = $state('');
	address = $state('');

	// Performer details
	performerType = $state('');
	genre = $state('');

	// Performance requirements
	technicalRider = $state('');
	minPerformanceDuration = $state<number | null>(null);
	travelRequirements = $state('');

	// Booking details
	agentName = $state('');
	agentContact = $state('');

	// Payment details (required for DJ Residency invoicing)
	bankName = $state('');
	bankAccountNumber = $state('');
	idDocument = $state('');
	taxId = $state('');
	pitRate = $state(companyConfig.defaultPerformerPitRate);
	pitRatePolicy = $state(companyConfig.defaultPerformerPitRatePolicy);

	// Notes
	notes = $state('');

	// Form submission state
	isSubmitting = $state(false);
	error = $state<string | null>(null);

	/**
	 * Initialize form state from a performer
	 */
	init(performer: PerformerContractor | null) {
		if (!performer) {
			this.reset();
			return;
		}

		this.name = performer.name;
		this.stageName = performer.stageName;
		this.email = performer.email || '';
		this.phone = performer.phone || '';
		this.address = performer.address || '';
		this.performerType = performer.performerType;
		this.genre = performer.genre || '';
		this.technicalRider = performer.technicalRider || '';
		this.minPerformanceDuration = performer.minPerformanceDuration;
		this.travelRequirements = performer.travelRequirements || '';
		this.agentName = performer.agentName || '';
		this.agentContact = performer.agentContact || '';
		this.bankName = performer.bankName || '';
		this.bankAccountNumber = performer.bankAccountNumber || '';
		this.idDocument = performer.idDocument || '';
		this.taxId = performer.taxId || '';
		this.pitRate = performer.pitRate ?? companyConfig.defaultPerformerPitRate;
		this.pitRatePolicy = performer.pitRatePolicy ?? companyConfig.defaultPerformerPitRatePolicy;
		this.notes = performer.notes || '';
	}

	/**
	 * Reset form to empty state
	 */
	reset() {
		this.name = '';
		this.stageName = '';
		this.email = '';
		this.phone = '';
		this.address = '';
		this.performerType = '';
		this.genre = '';
		this.technicalRider = '';
		this.minPerformanceDuration = null;
		this.travelRequirements = '';
		this.agentName = '';
		this.agentContact = '';
		this.bankName = '';
		this.bankAccountNumber = '';
		this.idDocument = '';
		this.taxId = '';
		this.pitRate = companyConfig.defaultPerformerPitRate;
		this.pitRatePolicy = companyConfig.defaultPerformerPitRatePolicy;
		this.notes = '';
		this.error = null;
	}
}
