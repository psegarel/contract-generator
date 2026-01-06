import { z } from 'zod';
import { baseContractSchema } from '../baseContract';

/**
 * Equipment item schema
 */
export const equipmentItemSchema = z.object({
	name: z.string().min(1, 'Equipment name is required'),
	quantity: z.number().min(1, 'Quantity must be at least 1'),
	unitPrice: z.number().min(0, 'Unit price must be positive'),
	serialNumbers: z.array(z.string()).default([])
});

/**
 * Equipment Rental Contract Schema
 */
export const equipmentRentalContractSchema = baseContractSchema
	.extend({
		type: z.literal('equipment-rental'),

		// Rental period
		rentalStartDate: z.string().min(1, 'Rental start date is required'),
		rentalEndDate: z.string().min(1, 'Rental end date is required'),

		// Equipment list
		equipment: z.array(equipmentItemSchema).min(1, 'At least one equipment item is required'),

		// Terms
		securityDeposit: z.number().min(0, 'Security deposit must be positive'),
		damageWaiver: z.boolean().default(false),
		deliveryFee: z.number().min(0, 'Delivery fee must be positive'),

		// Logistics
		pickupLocation: z.string().nullable().optional(),
		returnLocation: z.string().nullable().optional()
	})
	.strict();

/**
 * Input schema for creation
 */
export const equipmentRentalContractInputSchema = equipmentRentalContractSchema.omit({
	paidAt: true,
	paidBy: true
});

export type EquipmentRentalContractInput = z.infer<typeof equipmentRentalContractInputSchema>;
