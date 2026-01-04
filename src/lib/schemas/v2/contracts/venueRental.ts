import { z } from 'zod';
import { baseContractSchema } from '../baseContract';

/**
 * Venue Rental Contract Schema
 */
export const venueRentalContractSchema = baseContractSchema
	.extend({
		type: z.literal('venue-rental'),
		paymentDirection: z.literal('payable'),

		// Rental specifics
		rentalStartDateTime: z.string().min(1, 'Rental start date/time is required'),
		rentalEndDateTime: z.string().min(1, 'Rental end date/time is required'),
		securityDeposit: z.number().min(0, 'Security deposit must be positive'),
		securityDepositReturned: z.boolean().default(false),

		// Venue capacity & setup
		expectedAttendance: z.number().min(1, 'Expected attendance is required'),
		setupRequirements: z.string().nullable().optional(),

		// Terms
		cancellationPolicy: z.string().nullable().optional()
	})
	.strict();

/**
 * Input schema for creation
 */
export const venueRentalContractInputSchema = venueRentalContractSchema.omit({
	paidAt: true,
	paidBy: true
});

export type VenueRentalContractInput = z.infer<typeof venueRentalContractInputSchema>;
