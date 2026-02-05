import type { DjResidencyContract } from '$lib/types/v2';

/**
 * Form state class for DJ Residency Contract forms
 * Manages all form fields and provides initialization/reset methods
 */
export class DjResidencyContractFormState {
	// Base contract fields
	contractNumber = $state('');
	eventId = $state<string | null>(null);
	counterpartyId = $state<string>('');
	paymentDirection = $state<'receivable'>('receivable'); // DJ residency always receivable
	paymentStatus = $state<'unpaid' | 'paid'>('unpaid');
	contractValue = $state(0); // Set to 0 initially - value established via monthly invoicing
	notes = $state('');

	// Contract Duration
	contractStartDate = $state('');
	contractEndDate = $state('');
	contractDurationMonths = $state(3); // Default 3 months

	// Performance Terms
	performanceDays = $state(''); // e.g., "Saturday and Sunday"
	performanceDaysVietnamese = $state(''); // e.g., "Thứ Bảy và Chủ Nhật"
	performanceHoursPerSet = $state(4);
	numberOfSetsPerDay = $state(2);

	// Payment Terms
	performanceFeeVND = $state(0);
	terminationNoticeDays = $state(7);

	// Residency Status
	residencyStatus = $state<'active' | 'completed' | 'terminated'>('active');

	// UI state
	isSubmitting = $state(false);
	error = $state<string | null>(null);

	// Inline counterparty creation state
	showCreateCounterparty = $state(false);
	isCreatingCounterparty = $state(false);
	newCounterpartyName = $state('');
	newCounterpartyEmail = $state('');
	newCounterpartyPhone = $state('');
	newCounterpartyAddress = $state('');
	newCounterpartyCompanyName = $state('');
	newCounterpartyTaxId = $state('');
	newCounterpartyRepresentativeName = $state('');
	newCounterpartyRepresentativePosition = $state('');
	newCounterpartyBankName = $state('');
	newCounterpartyBankAccountNumber = $state('');

	/**
	 * Initialize form state from a DJ residency contract
	 */
	init(contract: DjResidencyContract | null) {
		if (!contract) {
			this.reset();
			this.generateContractNumber();
			return;
		}

		// Load contract data
		this.contractNumber = contract.contractNumber;
		this.eventId = contract.eventId ?? null;
		this.counterpartyId = contract.counterpartyId;
		this.paymentDirection = 'receivable';
		this.paymentStatus = contract.paymentStatus;
		this.contractValue = contract.contractValue;
		this.notes = contract.notes || '';

		// Contract Duration
		this.contractStartDate = contract.contractStartDate;
		this.contractEndDate = contract.contractEndDate;
		this.contractDurationMonths = contract.contractDurationMonths;

		// Performance Terms
		this.performanceDays = contract.performanceDays;
		this.performanceDaysVietnamese = contract.performanceDaysVietnamese;
		this.performanceHoursPerSet = contract.performanceHoursPerSet;
		this.numberOfSetsPerDay = contract.numberOfSetsPerDay;

		// Payment Terms
		this.performanceFeeVND = contract.performanceFeeVND;
		this.terminationNoticeDays = contract.terminationNoticeDays;

		// Status
		this.residencyStatus = contract.residencyStatus;
	}

	/**
	 * Reset form to empty state
	 */
	reset() {
		this.contractNumber = '';
		this.eventId = null;
		this.counterpartyId = '';
		this.paymentDirection = 'receivable';
		this.paymentStatus = 'unpaid';
		this.contractValue = 0;
		this.notes = '';

		// Contract Duration - default to 3 months starting today
		this.contractStartDate = new Date().toISOString().split('T')[0];
		this.contractDurationMonths = 3;
		this.updateEndDateFromDuration();

		// Performance Terms
		this.performanceDays = 'Saturday and Sunday';
		this.performanceDaysVietnamese = 'Thứ Bảy và Chủ Nhật';
		this.performanceHoursPerSet = 4;
		this.numberOfSetsPerDay = 2;

		// Payment Terms
		this.performanceFeeVND = 0;
		this.terminationNoticeDays = 7;

		// Status
		this.residencyStatus = 'active';

		this.error = null;
		this.resetNewCounterpartyForm();
	}

	/**
	 * Reset new counterparty form fields
	 */
	resetNewCounterpartyForm() {
		this.newCounterpartyName = '';
		this.newCounterpartyEmail = '';
		this.newCounterpartyPhone = '';
		this.newCounterpartyAddress = '';
		this.newCounterpartyCompanyName = '';
		this.newCounterpartyTaxId = '';
		this.newCounterpartyRepresentativeName = '';
		this.newCounterpartyRepresentativePosition = '';
		this.newCounterpartyBankName = '';
		this.newCounterpartyBankAccountNumber = '';
		this.showCreateCounterparty = false;
		this.isCreatingCounterparty = false;
	}

	/**
	 * Generate a unique contract number for new contracts
	 */
	private generateContractNumber() {
		const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
		const timestamp = Date.now().toString().slice(-4);
		this.contractNumber = `DJR-${dateStr}-${timestamp}`;
	}

	/**
	 * Update end date based on start date and duration months
	 */
	updateEndDateFromDuration() {
		if (!this.contractStartDate) return;

		const startDate = new Date(this.contractStartDate);
		if (isNaN(startDate.getTime())) return;

		const endDate = new Date(startDate);
		endDate.setMonth(endDate.getMonth() + this.contractDurationMonths);
		this.contractEndDate = endDate.toISOString().split('T')[0];
	}

	/**
	 * Update duration based on start and end dates
	 */
	updateDurationFromDates() {
		if (!this.contractStartDate || !this.contractEndDate) return;

		const start = new Date(this.contractStartDate);
		const end = new Date(this.contractEndDate);

		if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

		const months =
			(end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
		this.contractDurationMonths = Math.max(1, months);
	}

	/**
	 * Get estimated monthly value based on performance fee and expected performances
	 * Assumes 4 performance days per week (if Saturday and Sunday)
	 */
	get estimatedMonthlyValue(): number {
		// Approximate 4-5 weeks per month, 2 days per week = 8-10 performances
		// This is just an estimate for display purposes
		const performancesPerMonth = 8; // Conservative estimate
		return this.performanceFeeVND * performancesPerMonth;
	}

	/**
	 * Get estimated total contract value over the duration
	 */
	get estimatedTotalValue(): number {
		return this.estimatedMonthlyValue * this.contractDurationMonths;
	}
}
