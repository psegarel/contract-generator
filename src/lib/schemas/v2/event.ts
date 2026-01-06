import { z } from 'zod';

/**
 * Event schema
 */
export const eventSchema = z.object({
	// Identity (id, createdAt, updatedAt added by Firestore)
	ownerUid: z.string().min(1, 'Owner UID is required'),

	// Event identity
	name: z.string().min(1, 'Event name is required'),
	eventType: z.string().nullable().optional(),
	description: z.string().nullable().optional(),

	// Location
	locationAddress: z.string().min(1, 'Location address is required'),
	locationName: z.string().nullable().optional(),
	venueCounterpartyId: z.string().nullable().optional(),

	// Timing
	eventDate: z.string().min(1, 'Event date is required'),
	startTime: z.string().nullable().optional(),
	endTime: z.string().nullable().optional(),
	setupDateTime: z.string().nullable().optional(),
	teardownDateTime: z.string().nullable().optional(),

	// Scale
	expectedAttendance: z.number().nullable().optional(),

	// Status
	status: z.enum(['planning', 'confirmed', 'in-progress', 'completed', 'cancelled']),

	// Contract relationships (computed/managed by system)
	contractIds: z.array(z.string()).default([]),

	// Financial summary (computed from contracts)
	totalReceivable: z.number().default(0),
	totalPayable: z.number().default(0),
	netRevenue: z.number().default(0),

	// Notes
	internalNotes: z.string().nullable().optional()
});

/**
 * Event input schema (for creation)
 * Omits computed fields
 */
export const eventInputSchema = eventSchema.omit({
	contractIds: true,
	totalReceivable: true,
	totalPayable: true,
	netRevenue: true
});

/**
 * TypeScript types
 */
export type EventInput = z.infer<typeof eventInputSchema>;
