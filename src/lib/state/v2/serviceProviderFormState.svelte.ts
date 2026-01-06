import type { ServiceProviderCounterparty } from '$lib/types/v2';

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
	notes = $state('');

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
		this.notes = serviceProvider.notes || '';
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
		this.notes = '';
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
}

