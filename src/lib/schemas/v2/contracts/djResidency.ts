import { z } from 'zod';
import { baseContractSchema } from '../baseContract';

/**
 * Performance Log Schema
 * Stored in subcollection: dj-residency-contracts/{id}/performances
 */
export const performanceLogSchema = z
	.object({
		date: z.string().min(1, 'Performance date is required'),
		performerId: z.string().min(1, 'Performer ID is required'),
		performerName: z.string().min(1, 'Performer name is required'),
		hoursWorked: z.number().min(0, 'Hours worked must be positive'),
		setsCompleted: z.number().min(0, 'Sets completed must be positive'),
		notes: z.string().nullable().optional(),
		invoiced: z.boolean().default(false),
		invoiceMonth: z.string().nullable().optional()
	})
	.strict();

export const performanceLogInputSchema = performanceLogSchema;
export type PerformanceLogInput = z.infer<typeof performanceLogInputSchema>;

/**
 * Monthly Invoice Schema
 * Stored in subcollection: dj-residency-contracts/{id}/invoices
 */
export const monthlyInvoiceSchema = z
	.object({
		month: z.string().min(1, 'Invoice month is required'),
		totalPerformances: z.number().min(0, 'Total performances must be positive'),
		totalAmount: z.number().min(0, 'Total amount must be positive'),
		serviceContractIds: z.array(z.string()).default([]),
		invoiceDate: z.string().min(1, 'Invoice date is required'),
		paymentDueDate: z.string().min(1, 'Payment due date is required'),
		status: z.enum(['draft', 'issued', 'paid'])
	})
	.strict();

export const monthlyInvoiceInputSchema = monthlyInvoiceSchema;
export type MonthlyInvoiceInput = z.infer<typeof monthlyInvoiceInputSchema>;

/**
 * DJ Residency Contract Schema
 */
export const djResidencyContractSchema = baseContractSchema
	.extend({
		type: z.literal('dj-residency'),
		paymentDirection: z.literal('receivable'),

		// Contract Duration
		contractStartDate: z.string().min(1, 'Contract start date is required'),
		contractEndDate: z.string().min(1, 'Contract end date is required'),
		contractDurationMonths: z.number().min(1, 'Contract duration must be at least 1 month'),

		// Performance Terms
		performanceDays: z.string().min(1, 'Performance days are required'),
		performanceDaysVietnamese: z.string().min(1, 'Performance days (Vietnamese) are required'),
		performanceHoursPerSet: z.number().min(1, 'Performance hours per set must be at least 1'),
		numberOfSetsPerDay: z.number().min(1, 'Number of sets per day must be at least 1'),

		// Payment Terms
		performanceFeeVND: z.number().min(0, 'Performance fee must be positive'),
		terminationNoticeDays: z.number().min(1, 'Termination notice days must be at least 1'),

		// Status
		residencyStatus: z.enum(['active', 'completed', 'terminated'])
	})
	.strict();

/**
 * Input schema for creation
 */
export const djResidencyContractInputSchema = djResidencyContractSchema.omit({
	paidAt: true,
	paidBy: true
});

export type DjResidencyContractInput = z.infer<typeof djResidencyContractInputSchema>;
