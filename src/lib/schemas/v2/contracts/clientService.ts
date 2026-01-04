import { z } from 'zod';
import { baseContractSchema } from '../baseContract';

/**
 * Client Service Contract Schema
 * Generic catch-all for receivable contracts
 */
export const clientServiceContractSchema = baseContractSchema
	.extend({
		type: z.literal('client-service'),
		paymentDirection: z.literal('receivable'),

		serviceDescription: z.string().min(1, 'Service description is required'),
		deliverables: z.array(z.string()).min(1, 'At least one deliverable is required'),
		startDate: z.string().min(1, 'Start date is required'),
		endDate: z.string().min(1, 'End date is required')
	})
	.strict();

/**
 * Input schema for creation
 */
export const clientServiceContractInputSchema = clientServiceContractSchema.omit({
	paidAt: true,
	paidBy: true
});

export type ClientServiceContractInput = z.infer<typeof clientServiceContractInputSchema>;
