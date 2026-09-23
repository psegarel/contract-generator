import { Timestamp } from 'firebase/firestore';
import type { DjResidencyContract } from '$lib/types/v2';
import {
	clientCounterpartySchema,
	type ClientCounterpartyInput
} from '$lib/schemas/v2/counterparty';
import {
	djResidencyContractInputSchema,
	type DjResidencyContractInput
} from '$lib/schemas/v2/contracts/djResidency';
import { saveCounterparty } from '$lib/utils/v2/counterparties';
import {
	saveDjResidencyContract,
	updateDjResidencyContract
} from '$lib/utils/v2/djResidencyContracts';

export interface DjResidencyFormValues {
	contractNumber: string;
	counterpartyId: string;
	paymentStatus: 'unpaid' | 'paid';
	notes: string;
	contractStartDate: string;
	contractEndDate: string;
	contractDurationMonths: number;
	performanceDays: string;
	numberOfSetsPerDay: number;
	performanceFeeVND: number;
	terminationNoticeDays: number;
	residencyStatus: 'active' | 'completed' | 'terminated';
}

export interface NewDjResidencyCounterpartyValues {
	name: string;
	email: string;
	phone: string;
	address: string;
	companyName: string;
	taxId: string;
	representativeName: string;
	representativePosition: string;
	bankName: string;
	bankAccountNumber: string;
}

interface SaveDjResidencyFormOptions {
	values: DjResidencyFormValues;
	ownerUid: string;
	counterpartyName: string;
	contract?: DjResidencyContract | null;
}

/**
 * Validate the checks that need to happen before the persisted contract schema.
 * Returns a user-facing message so the component does not own business rules.
 */
export function validateDjResidencyForm(
	values: DjResidencyFormValues,
	ownerUid: string | null | undefined
): string | null {
	if (!ownerUid) {
		return 'You must be logged in to create a contract';
	}

	if (!values.counterpartyId) {
		return 'Please select a counterparty (Party B)';
	}

	if (!values.contractStartDate || !values.contractEndDate) {
		return 'Please set contract start and end dates';
	}

	if (!values.performanceFeeVND || values.performanceFeeVND <= 0) {
		return 'Please set a valid hourly rate';
	}

	return null;
}

/** Build the persisted contract payload from the form values. */
export function buildDjResidencyContractInput(
	values: DjResidencyFormValues,
	ownerUid: string,
	counterpartyName: string
): DjResidencyContractInput {
	return {
		type: 'dj-residency',
		ownerUid,
		contractNumber: values.contractNumber,
		eventId: null,
		counterpartyId: values.counterpartyId,
		counterpartyName,
		eventName: null,
		paymentDirection: 'receivable',
		paymentStatus: values.paymentStatus,
		contractValue: 0,
		currency: 'VND',
		notes: values.notes || null,

		contractStartDate: values.contractStartDate,
		contractEndDate: values.contractEndDate,
		contractDurationMonths: values.contractDurationMonths,

		performanceDays: values.performanceDays,
		numberOfSetsPerDay: values.numberOfSetsPerDay,

		performanceFeeVND: values.performanceFeeVND,
		terminationNoticeDays: values.terminationNoticeDays,

		residencyStatus: values.residencyStatus
	};
}

/** Save or update a DJ residency contract after all form-level checks pass. */
export async function saveDjResidencyForm({
	values,
	ownerUid,
	counterpartyName,
	contract = null
}: SaveDjResidencyFormOptions): Promise<string> {
	const prerequisiteError = validateDjResidencyForm(values, ownerUid);
	if (prerequisiteError) {
		throw new Error(prerequisiteError);
	}

	const contractData = buildDjResidencyContractInput(values, ownerUid, counterpartyName);
	const validationResult = djResidencyContractInputSchema.safeParse(contractData);
	if (!validationResult.success) {
		throw new Error('Validation error: ' + validationResult.error.issues[0].message);
	}

	if (contract) {
		await updateDjResidencyContract(contract.id, contractData);
		return contract.id;
	}

	return saveDjResidencyContract(contractData);
}

/** Create a venue counterparty from the inline DJ residency form. */
export async function createDjResidencyCounterparty(
	values: NewDjResidencyCounterpartyValues,
	ownerUid: string | null | undefined
): Promise<string> {
	if (!ownerUid) {
		throw new Error('You must be logged in to create a counterparty');
	}

	if (!values.name) {
		throw new Error('Please fill in counterparty name');
	}

	const clientData: ClientCounterpartyInput = {
		type: 'client',
		clientType: 'company',
		ownerUid,
		name: values.name,
		email: values.email || null,
		phone: values.phone || null,
		address: values.address || null,
		companyName: values.companyName || null,
		taxId: values.taxId || null,
		bankName: values.bankName || null,
		bankAccountNumber: values.bankAccountNumber || null,
		representativeName: values.representativeName || null,
		representativePosition: values.representativePosition || null,
		idDocument: null,
		notes: null,
		createdAt: Timestamp.now(),
		updatedAt: Timestamp.now()
	};

	const validationResult = clientCounterpartySchema.safeParse(clientData);
	if (!validationResult.success) {
		throw new Error('Validation error: ' + validationResult.error.issues[0].message);
	}

	return saveCounterparty(clientData);
}
