import { z } from 'zod';

const nullableString = z.string().trim().nullable().optional();

export const equipmentCategorySchema = z.enum(['audio', 'lighting', 'dj']);

export const quotationCustomerSchema = z
	.object({
		type: z.enum(['existing-client', 'lead']),
		clientId: nullableString,
		leadId: nullableString,
		name: z.string().trim().min(1, 'Customer name is required'),
		companyName: nullableString,
		email: z.email('A valid customer email is required').nullable().optional(),
		phone: nullableString,
		address: nullableString
	})
	.superRefine((customer, context) => {
		if (customer.type === 'existing-client' && !customer.clientId) {
			context.addIssue({ code: 'custom', path: ['clientId'], message: 'Client ID is required' });
		}
		if (customer.type === 'lead' && !customer.leadId) {
			context.addIssue({ code: 'custom', path: ['leadId'], message: 'Lead ID is required' });
		}
	});

export const quotationLineItemSchema = z.object({
	catalogItemId: z.string().trim().min(1, 'Catalogue item is required'),
	name: z.string().trim().min(1, 'Equipment name is required'),
	category: equipmentCategorySchema,
	manufacturer: nullableString,
	quantity: z.number().int().min(1, 'Quantity must be at least 1'),
	unitPriceVnd: z.number().int().min(0, 'Unit price cannot be negative'),
	imageUrl: z.url('Image URL must be valid').nullable().optional(),
	note: nullableString
});

export const quotationInputSchema = z.object({
	status: z.enum(['draft', 'sent', 'accepted', 'declined', 'expired']).default('draft'),
	customer: quotationCustomerSchema,
	lineItems: z.array(quotationLineItemSchema).min(1, 'At least one equipment item is required'),
	equipmentDiscountPercent: z
		.number()
		.min(0, 'Discount cannot be negative')
		.max(100, 'Discount cannot exceed 100'),
	transportVnd: z.number().int().min(0, 'Transport cost cannot be negative'),
	handlingVnd: z.number().int().min(0, 'Handling cost cannot be negative'),
	validUntil: z.iso.date('Quotation expiry date must be a valid date'),
	eventName: nullableString,
	eventDate: z.iso.date().nullable().optional(),
	venue: nullableString,
	notes: nullableString
});

export const leadInputSchema = z.object({
	name: z.string().trim().min(1, 'Lead name is required'),
	companyName: nullableString,
	email: z.email('A valid lead email is required'),
	phone: nullableString,
	address: nullableString,
	source: z.enum(['quotation', 'catalogue', 'manual', 'other']).default('quotation'),
	status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).default('new')
});

export type QuotationInputSchema = z.infer<typeof quotationInputSchema>;
export type LeadInputSchema = z.infer<typeof leadInputSchema>;
