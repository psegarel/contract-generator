import { z } from 'zod';
import { baseContractSchema, baseContractInputSchema } from '../baseContract';

/**
 * Common service provision fields (used by both full and input schemas)
 */
const serviceProvisionFields = {
	type: z.literal('service-provision'),
	paymentDirection: z.literal('payable'),

	// Service details (from old ContractData)
	jobName: z.string().min(1, 'Job name is required'),
	jobContent: z.string().min(1, 'Job content is required'),
	numberOfPerformances: z.number().min(1, 'Number of performances must be at least 1'),
	firstPerformanceTime: z.string().min(1, 'First performance time is required'),

	// Dates
	startDate: z.string().min(1, 'Start date is required'),
	endDate: z.string().min(1, 'End date is required'),

	// Tax
	taxRate: z.number().min(0).max(100, 'Tax rate must be between 0 and 100'),
	netFee: z.number().min(0, 'Net fee must be positive'),

	// Status
	status: z.enum(['draft', 'generated']),

	// Banking
	bankName: z.string().min(1, 'Bank name is required'),
	accountNumber: z.string().min(1, 'Account number is required'),

	// Client details (for PDF generation)
	clientEmail: z.email(),
	clientAddress: z.string().min(1, 'Client address is required'),
	clientPhone: z.string().min(1, 'Client phone is required'),
	clientIdDocument: z.string().min(1, 'Client ID document is required'),
	clientTaxId: z.string().nullable().optional(),

	// Event location
	eventLocation: z.string().min(1, 'Event location is required')
};

/**
 * Service Provision Contract Schema (full schema with paidAt/paidBy)
 * Migrated from old service contract
 */
export const serviceProvisionContractSchema = baseContractSchema
	.extend(serviceProvisionFields)
	.strict();

/**
 * Input schema for creation (no paidAt/paidBy fields)
 */
export const serviceProvisionContractInputSchema = baseContractInputSchema
	.extend(serviceProvisionFields)
	.strict();

export type ServiceProvisionContractInput = z.infer<typeof serviceProvisionContractInputSchema>;
