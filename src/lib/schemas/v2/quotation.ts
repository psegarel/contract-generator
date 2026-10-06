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

export const quotationPackageCatalogueSchema = z.object({
	slug: z.string().trim().min(1),
	name: z.string().trim().min(1),
	tagline: z.string(),
	description: z.string(),
	guestRange: z.object({
		min: z.number().int().positive(),
		max: z.number().int().positive().nullable()
	}),
	priceRange: z
		.object({
			minVND: z.number().int().nonnegative(),
			maxVND: z.number().int().nonnegative(),
			currency: z.literal('VND')
		})
		.refine(
			(range) => range.maxVND >= range.minVND,
			'Maximum package price must not be below minimum'
		),
	equipment: z.array(
		z.object({
			name: z.string().trim().min(1),
			category: equipmentCategorySchema,
			quantity: z.number().int().positive(),
			outsourced: z.boolean(),
			manufacturer: z.string().trim().nullable().default(null),
			imageUrl: z.url().nullable().default(null),
			note: z.string().trim().nullable().default(null)
		})
	),
	crew: z.array(z.object({ label: z.string().trim().min(1), count: z.number().int().positive() })),
	highlights: z.array(z.string())
});

export const quotationPackageSnapshotSchema = quotationPackageCatalogueSchema.extend({
	expectedGuests: z.number().int().positive(),
	quotedPriceVnd: z.number().int().nonnegative()
});

export const quotationInputSchema = z
	.object({
		status: z.enum(['draft', 'sent', 'accepted', 'declined', 'expired']).default('draft'),
		customer: quotationCustomerSchema,
		packageSnapshot: quotationPackageSnapshotSchema.nullable().optional(),
		packageDiscountPercent: z.number().min(0).max(100).default(0),
		lineItems: z.array(quotationLineItemSchema),
		equipmentDiscountPercent: z
			.number()
			.min(0, 'Discount cannot be negative')
			.max(100, 'Discount cannot exceed 100'),
		transportVnd: z.number().int().min(0, 'Transport cost cannot be negative'),
		handlingVnd: z.number().int().min(0, 'Handling cost cannot be negative'),
		vatRatePercent: z
			.number()
			.min(0, 'VAT rate cannot be negative')
			.max(100, 'VAT rate cannot exceed 100')
			.nullable(),
		validUntil: z.iso.date('Quotation expiry date must be a valid date'),
		eventName: nullableString,
		eventDate: z.iso.date().nullable().optional(),
		venue: nullableString,
		notes: nullableString
	})
	.superRefine((quotation, context) => {
		if (!quotation.packageSnapshot && quotation.lineItems.length === 0) {
			context.addIssue({
				code: 'custom',
				path: ['lineItems'],
				message: 'Add a package or at least one equipment item'
			});
		}
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
