import type { ServiceProviderCounterparty, CounterpartyDocuments, DocumentMetadata } from '$lib/types/v2';

export class ServiceProviderFormState {
	name = $state('');
	email = $state('');
	phone = $state('');
	address = $state('');
	serviceType = $state('');
	companyName = $state('');
	typicalDeliverables = $state<string[]>([]);
	equipmentProvided = $state<string[]>([]);
	businessLicense = $state('');
	insuranceInfo = $state('');
	taxId = $state('');
	bankName = $state('');
	bankAccountNumber = $state('');
	idDocument = $state('');
	notes = $state('');

	// Document upload state
	documents = $state<CounterpartyDocuments>({});
	uploadingDocuments = $state<Record<string, boolean>>({}); // Track upload state per image number

	// Temporary state for adding items to arrays
	newDeliverable = $state('');
	newEquipment = $state('');

	// Form submission state
	isSubmitting = $state(false);
	error = $state<string | null>(null);

	/**
	 * Initialize form state from a service provider
	 */
	init(serviceProvider: ServiceProviderCounterparty | null) {
		if (!serviceProvider) {
			this.reset();
			return;
		}

		this.name = serviceProvider.name;
		this.email = serviceProvider.email || '';
		this.phone = serviceProvider.phone || '';
		this.address = serviceProvider.address || '';
		this.serviceType = serviceProvider.serviceType;
		this.companyName = serviceProvider.companyName || '';
		this.typicalDeliverables = [...serviceProvider.typicalDeliverables];
		this.equipmentProvided = [...serviceProvider.equipmentProvided];
		this.businessLicense = serviceProvider.businessLicense || '';
		this.insuranceInfo = serviceProvider.insuranceInfo || '';
		this.taxId = serviceProvider.taxId || '';
		this.bankName = serviceProvider.bankName || '';
		this.bankAccountNumber = serviceProvider.bankAccountNumber || '';
		this.idDocument = serviceProvider.idDocument || '';
		this.notes = serviceProvider.notes || '';
		this.documents = serviceProvider.documents ? { ...serviceProvider.documents } : {};
	}

	/**
	 * Reset form to empty state
	 */
	reset() {
		this.name = '';
		this.email = '';
		this.phone = '';
		this.address = '';
		this.serviceType = '';
		this.companyName = '';
		this.typicalDeliverables = [];
		this.equipmentProvided = [];
		this.businessLicense = '';
		this.insuranceInfo = '';
		this.taxId = '';
		this.bankName = '';
		this.bankAccountNumber = '';
		this.idDocument = '';
		this.notes = '';
		this.documents = {};
		this.uploadingDocuments = {};
		this.newDeliverable = '';
		this.newEquipment = '';
		this.error = null;
	}

	/**
	 * Add a deliverable to the list
	 */
	addDeliverable() {
		if (this.newDeliverable.trim()) {
			this.typicalDeliverables = [...this.typicalDeliverables, this.newDeliverable.trim()];
			this.newDeliverable = '';
		}
	}

	/**
	 * Remove a deliverable from the list
	 */
	removeDeliverable(index: number) {
		this.typicalDeliverables = this.typicalDeliverables.filter((_, i) => i !== index);
	}

	/**
	 * Add equipment to the list
	 */
	addEquipment() {
		if (this.newEquipment.trim()) {
			this.equipmentProvided = [...this.equipmentProvided, this.newEquipment.trim()];
			this.newEquipment = '';
		}
	}

	/**
	 * Remove equipment from the list
	 */
	removeEquipment(index: number) {
		this.equipmentProvided = this.equipmentProvided.filter((_, i) => i !== index);
	}

	/**
	 * Set document metadata for a specific image number
	 */
	setDocument(imageNumber: 1 | 2 | 3 | 4 | 5, metadata: DocumentMetadata | undefined) {
		this.documents = { ...this.documents };
		if (metadata) {
			this.documents[`image${imageNumber}` as keyof CounterpartyDocuments] = metadata;
		} else {
			delete this.documents[`image${imageNumber}` as keyof CounterpartyDocuments];
		}
	}

	/**
	 * Get document metadata for a specific image number
	 */
	getDocument(imageNumber: 1 | 2 | 3 | 4 | 5): DocumentMetadata | undefined {
		return this.documents[`image${imageNumber}` as keyof CounterpartyDocuments] as
			| DocumentMetadata
			| undefined;
	}

	/**
	 * Set uploading state for a document
	 */
	setUploading(imageNumber: 1 | 2 | 3 | 4 | 5, uploading: boolean) {
		this.uploadingDocuments = { ...this.uploadingDocuments };
		if (uploading) {
			this.uploadingDocuments[`image${imageNumber}`] = true;
		} else {
			delete this.uploadingDocuments[`image${imageNumber}`];
		}
	}

	/**
	 * Check if a document is currently uploading
	 */
	isUploading(imageNumber: 1 | 2 | 3 | 4 | 5): boolean {
		return this.uploadingDocuments[`image${imageNumber}`] === true;
	}

	/**
	 * Get next available image number for upload
	 */
	getNextAvailableImageNumber(): 1 | 2 | 3 | 4 | 5 | null {
		for (let i = 1; i <= 5; i++) {
			const num = i as 1 | 2 | 3 | 4 | 5;
			if (!this.getDocument(num)) {
				return num;
			}
		}
		return null;
	}
}

