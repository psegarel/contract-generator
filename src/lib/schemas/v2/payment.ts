import { z } from 'zod';

/**
 * Full payment schema — validates data read from Firestore
 */
export const paymentSchema = z
	.object({
		contractId: z.string().min(1, 'Contract ID is required'),
		contractType: z.enum([
			'venue-rental',
			'performer-booking',
			'equipment-rental',
			'service-provision',
			'event-planning',
			'subcontractor',
			'client-service'
		]),
		contractNumber: z.string().min(1, 'Contract number is required'),
		counterpartyName: z.string().min(1, 'Counterparty name is required'),
		paymentType: z.enum(['one-time', 'recurring']),
		amount: z.number().min(0, 'Amount must be positive'),
		currency: z.literal('VND'),
		direction: z.enum(['receivable', 'payable']),
		status: z.enum(['pending', 'paid']),
		label: z.string().nullable().optional(),
		dueDate: z.any().nullable().optional(),
		paidAt: z.any().nullable().optional(),
		paidBy: z.string().nullable().optional(),
		ownerUid: z.string().min(1, 'Owner UID is required'),
		notes: z.string().nullable().optional()
	})
	.strict();

/**
 * Payment input schema — for creating new payment records
 * Omits paidAt and paidBy (set when marking as paid)
 */
export const paymentInputSchema = paymentSchema.omit({
	paidAt: true,
	paidBy: true
});

export type PaymentInput = z.infer<typeof paymentInputSchema>;
