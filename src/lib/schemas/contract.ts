import { z } from 'zod';

export const contractSchema = z.object({
	clientName: z.string().min(1, 'Client Name is required'),
	clientAddress: z.string().min(1, 'Client Address is required'),
	clientPhone: z.string().min(1, 'Client Phone is required'),
	clientTaxId: z.string().optional(),
	
	// Event details
	jobName: z.string().min(1, 'Job Name is required'),
	eventName: z.string().min(1, 'Event Name is required'),
	numberOfPerformances: z.number().min(1, 'Number of Performances must be at least 1'),
	eventLocation: z.string().min(1, 'Event Location is required'),
	firstPerformanceTime: z.string().min(1, 'Performance Time is required'),
	jobContent: z.string().min(1, 'Job Content is required'),
	
	// Bank details
	bankName: z.string().min(1, 'Bank Name is required'),
	accountNumber: z.string().min(1, 'Account Number is required'),
	
	// Financial
	netFee: z.number().min(0, 'Net Fee must be a positive number'),
	taxRate: z.number().min(0, 'Tax Rate must be a positive number').max(100, 'Tax Rate cannot exceed 100%'),
	
	// Dates
	startDate: z.string().min(1, 'Start Date is required'),
	endDate: z.string().min(1, 'End Date is required')
});

export type ContractData = z.infer<typeof contractSchema>;
