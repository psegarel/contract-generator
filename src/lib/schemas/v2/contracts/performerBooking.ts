import { z } from 'zod';
import { baseContractSchema } from '../baseContract';

/**
 * Performer Booking Contract Schema
 */
export const performerBookingContractSchema = baseContractSchema
	.extend({
		type: z.literal('performer-booking'),

		// Performance details
		performanceDate: z.string().min(1, 'Performance date is required'),
		performanceStartTime: z.string().min(1, 'Performance start time is required'),
		performanceDuration: z.number().min(1, 'Performance duration must be at least 1 minute'),

		// Requirements
		technicalRequirements: z.string().nullable().optional(),
		rehearsalDateTime: z.string().nullable().optional(),
		soundCheckDateTime: z.string().nullable().optional(),

		// Content
		setList: z.string().nullable().optional(),
		specialRequests: z.string().nullable().optional()
	})
	.strict();

/**
 * Input schema for creation
 */
export const performerBookingContractInputSchema = performerBookingContractSchema.omit({
	paidAt: true,
	paidBy: true
});

export type PerformerBookingContractInput = z.infer<typeof performerBookingContractInputSchema>;
