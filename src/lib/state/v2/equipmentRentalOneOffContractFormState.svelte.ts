import type { EquipmentRentalOneOffContract } from '$lib/types/v2';
import { SvelteDate } from 'svelte/reactivity';

/**
 * Form state class for Equipment Rental One-Off Contract forms
 * Single-event equipment rental. All monetary amounts are NET of VAT.
 */
export class EquipmentRentalOneOffContractFormState {
	// Base contract fields
	contractNumber = $state('');
	eventId = $state<string | null>(null);
	counterpartyId = $state<string>('');
	paymentStatus = $state<'unpaid' | 'paid'>('unpaid');
	contractValue = $state(0); // = rentalFee (net of VAT)
	notes = $state('');

	// Quotation reference
	quotationReference = $state('');

	// Event details
	eventName = $state('');
	eventDate = $state('');

	// Setup & collection (ISO datetime-local strings)
	setupDateTime = $state('');
	collectionDateTime = $state('');

	// Venue/delivery location
	venueName = $state('');
	venueNameEnglish = $state('');
	venueAddress = $state('');
	venueAddressEnglish = $state('');

	// Financial (all NET of VAT)
	deposit = $state(0);
	vatRate = $state(8); // Default 8% for Vietnam
	replacementValue = $state(0);

	// Payment terms
	balancePaymentDays = $state(7);
	latePaymentPenaltyRate = $state(0.1); // 0.1% per day
	latePaymentPenaltyCap = $state(8); // 8% cap

	// Cancellation terms
	cancellationTier1Days = $state(14);
	cancellationTier1Percent = $state(50);
	cancellationTier2Days = $state(14);
	cancellationTier2Percent = $state(100);

	// Equipment list (Annex 1 body)
	equipmentList = $state('');

	// UI state
	isSubmitting = $state(false);
	error = $state<string | null>(null);

	/**
	 * Initialize form state from an existing contract or reset for new
	 */
	init(contract: EquipmentRentalOneOffContract | null, initialEventId?: string) {
		if (!contract) {
			this.reset();
			if (initialEventId) {
				this.eventId = initialEventId;
			}
			this.generateContractNumber();
			return;
		}

		this.contractNumber = contract.contractNumber;
		this.eventId = contract.eventId;
		this.counterpartyId = contract.counterpartyId;
		this.paymentStatus = contract.paymentStatus;
		this.contractValue = contract.contractValue;
		this.notes = contract.notes || '';
		this.quotationReference = contract.quotationReference;
		this.eventName = contract.eventName;
		this.eventDate = contract.eventDate;
		this.setupDateTime = contract.setupDateTime;
		this.collectionDateTime = contract.collectionDateTime;
		this.venueName = contract.venueName;
		this.venueNameEnglish = contract.venueNameEnglish;
		this.venueAddress = contract.venueAddress;
		this.venueAddressEnglish = contract.venueAddressEnglish;
		this.deposit = contract.deposit;
		this.vatRate = contract.vatRate;
		this.replacementValue = contract.replacementValue;
		this.balancePaymentDays = contract.balancePaymentDays;
		this.latePaymentPenaltyRate = contract.latePaymentPenaltyRate;
		this.latePaymentPenaltyCap = contract.latePaymentPenaltyCap;
		this.cancellationTier1Days = contract.cancellationTier1Days;
		this.cancellationTier1Percent = contract.cancellationTier1Percent;
		this.cancellationTier2Days = contract.cancellationTier2Days;
		this.cancellationTier2Percent = contract.cancellationTier2Percent;
		this.equipmentList = contract.equipmentList;
	}

	/**
	 * Reset form to empty state (with sensible defaults for terms)
	 */
	reset() {
		this.contractNumber = '';
		this.eventId = null;
		this.counterpartyId = '';
		this.paymentStatus = 'unpaid';
		this.contractValue = 0;
		this.notes = '';
		this.quotationReference = '';
		this.eventName = '';
		this.eventDate = '';
		this.setupDateTime = '';
		this.collectionDateTime = '';
		this.venueName = '';
		this.venueNameEnglish = '';
		this.venueAddress = '';
		this.venueAddressEnglish = '';
		this.deposit = 0;
		this.vatRate = 8;
		this.replacementValue = 0;
		this.balancePaymentDays = 7;
		this.latePaymentPenaltyRate = 0.1;
		this.latePaymentPenaltyCap = 8;
		this.cancellationTier1Days = 14;
		this.cancellationTier1Percent = 50;
		this.cancellationTier2Days = 14;
		this.cancellationTier2Percent = 100;
		this.equipmentList = '';
		this.error = null;
	}

	/**
	 * Generate a unique contract number for new contracts
	 */
	private generateContractNumber() {
		const dateStr = new SvelteDate().toISOString().slice(0, 10).replace(/-/g, '');
		const timestamp = Date.now().toString().slice(-4);
		this.contractNumber = `EQR-${dateStr}-${timestamp}`;
	}
}
