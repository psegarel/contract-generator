import { Timestamp } from 'firebase/firestore';
import type { PerformerContractor } from '$lib/types/v2';
import { performerContractorSchema, type PerformerContractorInput } from '$lib/schemas/v2';
import { saveCounterparty, updateCounterparty } from '$lib/utils/v2/counterparties';
import { companyConfig } from '$lib/config/company';

export interface PerformerFormValues {
	name: string;
	stageName: string;
	email: string;
	phone: string;
	address: string;
	performerType: string;
	genre: string;
	technicalRider: string;
	minPerformanceDuration: number | null;
	travelRequirements: string;
	agentName: string;
	agentContact: string;
	bankName: string;
	bankAccountNumber: string;
	idDocument: string;
	taxId: string;
	pitRate: number;
	pitRatePolicy: string;
	notes: string;
}

interface SavePerformerFormOptions {
	values: PerformerFormValues;
	ownerUid: string | null | undefined;
	performer?: PerformerContractor | null;
}

export function buildPerformerInput(
	values: PerformerFormValues,
	ownerUid: string,
	createdAt = Timestamp.now()
): PerformerContractorInput {
	return {
		type: 'contractor',
		contractorType: 'performer',
		ownerUid,
		name: values.name,
		stageName: values.stageName,
		performerType: values.performerType,
		genre: values.genre || null,
		email: values.email || null,
		phone: values.phone || null,
		address: values.address || null,
		technicalRider: values.technicalRider || null,
		minPerformanceDuration: values.minPerformanceDuration,
		travelRequirements: values.travelRequirements || null,
		agentName: values.agentName || null,
		agentContact: values.agentContact || null,
		bankName: values.bankName || null,
		bankAccountNumber: values.bankAccountNumber || null,
		idDocument: values.idDocument || null,
		taxId: values.taxId || null,
		pitRate: values.pitRate,
		pitRatePolicy: values.pitRatePolicy || companyConfig.defaultPerformerPitRatePolicy,
		notes: values.notes || null,
		createdAt,
		updatedAt: Timestamp.now()
	};
}

export async function savePerformerForm({
	values,
	ownerUid,
	performer
}: SavePerformerFormOptions): Promise<string> {
	if (!ownerUid) {
		throw new Error('You must be logged in to create a performer');
	}

	const performerData = buildPerformerInput(
		values,
		ownerUid,
		performer?.createdAt || Timestamp.now()
	);
	const validationResult = performerContractorSchema.safeParse(performerData);
	if (!validationResult.success) {
		throw new Error('Validation error: ' + validationResult.error.issues[0].message);
	}

	if (performer) {
		await updateCounterparty(performer.id, performerData);
		return performer.id;
	}

	return saveCounterparty(performerData);
}
