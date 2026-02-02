import type { EquipmentRentalContract, EquipmentItem, Counterparty } from '$lib/types/v2';
import { generateContractNumber } from '$lib/utils/contractHelpers';

/**
 * Form state class for Equipment Rental Contract forms
 * Manages all form fields and provides initialization/reset methods
 */
export class EquipmentRentalContractFormState {
	// Base contract fields
	contractNumber = $state('');
	eventId = $state<string | null>(null); // Optional - equipment rental can be standalone
	counterpartyId = $state<string>('');
	paymentDirection = $state<'receivable' | 'payable'>('receivable');
	paymentStatus = $state<'unpaid' | 'paid'>('unpaid');
	contractValue = $state(0);
	notes = $state('');

	// Rental period
	rentalStartDate = $state('');
	rentalEndDate = $state('');

	// Equipment list
	equipment = $state<EquipmentItem[]>([]);

	// Rent
	monthlyRent = $state(0);

	// Terms
	securityDeposit = $state(0);
	damageWaiver = $state(false);
	deliveryFee = $state(0);

	// Venue information (where equipment will be located/used)
	venueName = $state('');
	venueNameEnglish = $state('');
	venueAddress = $state('');
	venueAddressEnglish = $state('');

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
	 * Initialize form state from an equipment rental contract
	 */
	init(contract: EquipmentRentalContract | null) {
		if (!contract) {
			this.reset();
			// Auto-generate contract number for new contracts
			this.generateContractNumber();
			return;
		}

		// Load contract data
		this.contractNumber = contract.contractNumber;
		this.eventId = null; // Equipment rental contracts are always standalone
		this.counterpartyId = contract.counterpartyId;
		this.paymentDirection = 'receivable'; // Equipment rental contracts are always receivable
		this.paymentStatus = contract.paymentStatus;
		this.contractValue = contract.contractValue;
		this.rentalStartDate = contract.rentalStartDate;
		this.rentalEndDate = contract.rentalEndDate;
		this.equipment = contract.equipment.map((item) => ({
			...item,
			serialNumbers: item.serialNumbers || []
		}));
		this.monthlyRent = contract.monthlyRent || 0;
		this.securityDeposit = contract.securityDeposit;
		this.damageWaiver = contract.damageWaiver;
		this.deliveryFee = contract.deliveryFee;
		this.venueName = contract.venueName || '';
		this.venueNameEnglish = contract.venueNameEnglish || '';
		this.venueAddress = contract.venueAddress || '';
		this.venueAddressEnglish = contract.venueAddressEnglish || '';
		this.notes = contract.notes || '';
	}

	/**
	 * Reset form to empty state
	 */
	reset() {
		this.contractNumber = '';
		this.eventId = null; // Equipment rental contracts are always standalone
		this.counterpartyId = '';
		this.paymentDirection = 'receivable'; // Equipment rental contracts are always receivable
		this.paymentStatus = 'unpaid';
		this.contractValue = 0;
		this.rentalStartDate = '';
		this.rentalEndDate = '';
		this.equipment = [];
		this.monthlyRent = 0;
		this.securityDeposit = 0;
		this.damageWaiver = false;
		this.deliveryFee = 0;
		this.venueName = '';
		this.venueNameEnglish = '';
		this.venueAddress = '';
		this.venueAddressEnglish = '';
		this.notes = '';
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
		// Use generic format for equipment rental
		const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
		const timestamp = Date.now().toString().slice(-4);
		this.contractNumber = `EQP-${dateStr}-${timestamp}`;
	}

	/**
	 * Auto-fill details from selected counterparty
	 * For equipment rental, counterparty can be Supplier (we rent from) or Client (we rent to)
	 */
	fillFromCounterparty(counterparty: Counterparty | null) {
		if (!counterparty) return;

		// Equipment rental contracts don't have specific auto-fill fields
		// The counterparty selection is mainly for relationship tracking
		// User will need to fill equipment and terms manually
	}

	/**
	 * Add a new equipment item to the list
	 */
	addEquipmentItem() {
		this.equipment = [
			...this.equipment,
			{
				name: '',
				quantity: 1,
				unitPrice: 0,
				serialNumbers: []
			}
		];
	}

	/**
	 * Remove an equipment item from the list
	 */
	removeEquipmentItem(index: number) {
		if (index >= 0 && index < this.equipment.length) {
			this.equipment = this.equipment.filter((_, i) => i !== index);
		}
	}

	/**
	 * Update an equipment item in the list
	 */
	updateEquipmentItem(index: number, item: EquipmentItem) {
		if (index >= 0 && index < this.equipment.length) {
			this.equipment = this.equipment.map((eq, i) => (i === index ? item : eq));
		}
	}

	/**
	 * Calculate total equipment value (sum of quantity * unitPrice for all items)
	 * This represents the residual value of the physical assets.
	 */
	get totalEquipmentValue(): number {
		return this.equipment.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
	}

	/**
	 * Calculate rental duration in months between start and end dates.
	 * Returns 0 if dates are missing or invalid.
	 */
	get rentalMonths(): number {
		if (!this.rentalStartDate || !this.rentalEndDate) return 0;
		const start = new Date(this.rentalStartDate);
		const end = new Date(this.rentalEndDate);
		if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
		const months =
			(end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
		return Math.max(0, months);
	}

	/**
	 * Calculate total contract value (monthlyRent × rental months)
	 * This is the total revenue over the rental period.
	 */
	get calculatedContractValue(): number {
		return this.monthlyRent * this.rentalMonths;
	}
}
