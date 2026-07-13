import { z } from 'zod';
import { baseContractSchema } from '../baseContract';

/**
 * Equipment Rental One-Off Contract Schema
 * Single-event equipment rental referencing an external quotation.
 * All monetary amounts are NET of VAT.
 */
export const equipmentRentalOneOffContractSchema = baseContractSchema
	.extend({
		type: z.literal('equipment-rental-oneoff'),
		paymentDirection: z.literal('receivable'),

		// External quotation reference
		quotationReference: z.string().min(1, 'Quotation reference is required'),

		// Event details
		eventName: z.string().min(1, 'Event name is required'),
		eventDate: z.string().min(1, 'Event date is required'),

		// Setup & collection (ISO datetime strings)
		setupDateTime: z.string().min(1, 'Setup date/time is required'),
		collectionDateTime: z.string().min(1, 'Collection date/time is required'),

		// Venue/delivery location
		venueName: z.string().min(1, 'Venue name (Vietnamese) is required'),
		venueNameEnglish: z.string().min(1, 'Venue name (English) is required'),
		venueAddress: z.string().min(1, 'Venue address (Vietnamese) is required'),
		venueAddressEnglish: z.string().min(1, 'Venue address (English) is required'),

		// Financial (all amounts NET of VAT)
		deposit: z.number().min(0, 'Deposit must be positive'),
		vatRate: z.number().min(0, 'VAT rate must be positive'),
		replacementValue: z.number().min(0, 'Replacement value must be positive'),

		// Payment terms
		balancePaymentDays: z.number().int().min(1, 'Balance payment days must be at least 1'),
		latePaymentPenaltyRate: z.number().min(0, 'Late payment rate must be positive'),
		latePaymentPenaltyCap: z.number().min(0, 'Late payment cap must be positive'),

		// Cancellation terms
		cancellationTier1Days: z.number().int().min(1, 'Cancellation tier 1 days must be at least 1'),
		cancellationTier1Percent: z.number().min(0).max(100, 'Must be 0-100'),
		cancellationTier2Days: z.number().int().min(1, 'Cancellation tier 2 days must be at least 1'),
		cancellationTier2Percent: z.number().min(0).max(100, 'Must be 0-100'),

		// Equipment list (Annex 1 body)
		equipmentList: z.string().min(1, 'Equipment list is required')
	})
	.strict();

/**
 * Input schema for creation (omits payment audit fields)
 */
export const equipmentRentalOneOffContractInputSchema = equipmentRentalOneOffContractSchema.omit({
	paidAt: true,
	paidBy: true
});

export type EquipmentRentalOneOffContractInput = z.infer<
	typeof equipmentRentalOneOffContractInputSchema
>;
