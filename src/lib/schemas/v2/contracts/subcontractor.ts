import { z } from 'zod';
import { baseContractSchema } from '../baseContract';

/**
 * Subcontractor Contract Schema
 */
export const subcontractorContractSchema = baseContractSchema
	.extend({
		type: z.literal('subcontractor'),
		paymentDirection: z.literal('payable'),

		// Service scope
		serviceDescription: z.string().min(1, 'Service description is required'),
		deliverables: z.array(z.string()).min(1, 'At least one deliverable is required'),

		// Timeline
		startDate: z.string().min(1, 'Start date is required'),
		completionDate: z.string().min(1, 'Completion date is required'),

		// Terms
		paymentTerms: z.string().min(1, 'Payment terms are required'),
		terminationClause: z.string().nullable().optional()
	})
	.strict();

/**
 * Input schema for creation
 */
export const subcontractorContractInputSchema = subcontractorContractSchema.omit({
	paidAt: true,
	paidBy: true
});

export type SubcontractorContractInput = z.infer<typeof subcontractorContractInputSchema>;
