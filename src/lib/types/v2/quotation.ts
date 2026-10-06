import type { Timestamp } from 'firebase/firestore';

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'superseded';
export type QuotationCustomerType = 'existing-client' | 'lead';
export type LeadSource = 'quotation' | 'catalogue' | 'manual' | 'other';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

export type EquipmentCategory = 'audio' | 'lighting' | 'dj';

export interface QuotationCustomerSnapshot {
	type: QuotationCustomerType;
	clientId: string | null;
	leadId: string | null;
	name: string;
	companyName: string | null;
	email: string | null;
	phone: string | null;
	address: string | null;
}

export interface QuotationLineItem {
	catalogItemId: string;
	name: string;
	category: EquipmentCategory;
	manufacturer: string | null;
	quantity: number;
	unitPriceVnd: number;
	imageUrl: string | null;
	note: string | null;
}

export interface QuotationPackageEquipment {
	name: string;
	category: EquipmentCategory;
	quantity: number;
	outsourced: boolean;
	manufacturer: string | null;
	imageUrl: string | null;
	note: string | null;
}

export interface QuotationPackageCatalogueItem {
	slug: string;
	name: string;
	tagline: string;
	description: string;
	guestRange: { min: number; max: number | null };
	priceRange: { minVND: number; maxVND: number; currency: 'VND' };
	equipment: QuotationPackageEquipment[];
	crew: { label: string; count: number }[];
	highlights: string[];
}

export interface QuotationPackageSnapshot extends QuotationPackageCatalogueItem {
	expectedGuests: number;
	quotedPriceVnd: number;
}

export interface Quotation {
	id: string;
	quotationNumber: string;
	revision: number;
	rootQuotationId: string;
	revisionOfId: string | null;
	latestRevisionId?: string;
	latestRevision?: number;
	status: QuotationStatus;
	ownerUid: string;
	customer: QuotationCustomerSnapshot;
	packageSnapshot?: QuotationPackageSnapshot | null;
	packageDiscountPercent?: number;
	packageDiscountVnd?: number;
	lineItems: QuotationLineItem[];
	equipmentSubtotalVnd: number;
	equipmentDiscountPercent: number;
	equipmentDiscountVnd: number;
	transportVnd: number;
	handlingVnd: number;
	vatRatePercent: number | null;
	vatAmountVnd: number;
	totalVnd: number;
	validUntil: string;
	eventName: string | null;
	eventDate: string | null;
	venue: string | null;
	notes: string | null;
	createdAt: Timestamp;
	updatedAt: Timestamp;
	sentAt: Timestamp | null;
	acceptedAt: Timestamp | null;
	declinedAt: Timestamp | null;
	expiredAt: Timestamp | null;
}

export type QuotationInput = Omit<
	Quotation,
	| 'id'
	| 'quotationNumber'
	| 'revision'
	| 'rootQuotationId'
	| 'revisionOfId'
	| 'ownerUid'
	| 'equipmentSubtotalVnd'
	| 'equipmentDiscountVnd'
	| 'vatAmountVnd'
	| 'totalVnd'
	| 'createdAt'
	| 'updatedAt'
	| 'sentAt'
	| 'acceptedAt'
	| 'declinedAt'
	| 'expiredAt'
> & {
	status?: Exclude<QuotationStatus, 'superseded'>;
};

export interface Lead {
	id: string;
	ownerUid: string;
	name: string;
	companyName: string | null;
	email: string;
	phone: string | null;
	address: string | null;
	source: LeadSource;
	status: LeadStatus;
	quotationIds: string[];
	createdAt: Timestamp;
	updatedAt: Timestamp;
}

export type LeadInput = Omit<Lead, 'id' | 'ownerUid' | 'quotationIds' | 'createdAt' | 'updatedAt'>;
