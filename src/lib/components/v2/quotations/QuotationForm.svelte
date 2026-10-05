<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Plus, Trash2 } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import type {
		ClientCounterparty,
		EquipmentCatalogueItem,
		Quotation,
		QuotationInput,
		QuotationLineItem,
		QuotationCustomerSnapshot,
		EquipmentCategory
	} from '$lib/types/v2';
	import { saveLead } from '$lib/utils/v2/leads';
	import { saveQuotation, updateQuotation } from '$lib/utils/v2/quotations';
	import { getQuotationSettings } from '$lib/utils/v2/appConfig';
	import {
		calculateQuotationTotals,
		calculateQuotationVat
	} from '$lib/utils/v2/quotationCalculations';
	import { formatCurrency } from '$lib/utils/formatting';
	import { catalogueImageUrlForDisplay } from '$lib/utils/v2/catalogueImage';
	import { Button } from '$lib/components/ui/button';
	import FormSection from '$lib/components/FormSection.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import TextareaField from '$lib/components/TextareaField.svelte';
	import FormMessage from '$lib/components/FormMessage.svelte';

	interface Props {
		clients: ClientCounterparty[];
		catalogueItems: EquipmentCatalogueItem[];
		quotation?: Quotation;
		onSuccess?: (quotationId: string) => void;
		onCancel?: () => void;
	}

	let { clients, catalogueItems, quotation, onSuccess, onCancel }: Props = $props();

	let customerType = $state<'existing-client' | 'lead'>('existing-client');
	let clientId = $state('');
	let leadId = $state('');
	let leadName = $state('');
	let leadCompanyName = $state('');
	let leadEmail = $state('');
	let leadPhone = $state('');
	let leadAddress = $state('');
	let selectedCatalogueId = $state('');
	let catalogueSearch = $state('');
	let catalogueCategory = $state<'all' | EquipmentCategory>('all');
	let lineItems = $state<QuotationLineItem[]>([]);
	let discountPercent = $state('0');
	let transportVnd = $state('0');
	let handlingVnd = $state('0');
	let addVat = $state(false);
	let vatRatePercent = $state('');
	let defaultVatRatePercent = $state(8);
	let validUntil = $state(defaultValidUntil());
	let eventName = $state('');
	let eventDate = $state('');
	let venue = $state('');
	let notes = $state('');
	let isSubmitting = $state(false);
	let errorMessage = $state('');

	onMount(async () => {
		try {
			const settings = await getQuotationSettings();
			defaultVatRatePercent = settings.defaultVatRatePercent;
			if (!quotation) vatRatePercent = String(defaultVatRatePercent);
		} catch (error) {
			console.error('Failed to load quotation settings:', error);
			if (!quotation) vatRatePercent = '8';
		}
		if (!quotation) return;
		customerType = quotation.customer.type;
		clientId = quotation.customer.clientId ?? '';
		leadId = quotation.customer.leadId ?? '';
		leadName = quotation.customer.name;
		leadCompanyName = quotation.customer.companyName ?? '';
		leadEmail = quotation.customer.email ?? '';
		leadPhone = quotation.customer.phone ?? '';
		leadAddress = quotation.customer.address ?? '';
		lineItems = quotation.lineItems.map((item) => ({ ...item }));
		discountPercent = String(quotation.equipmentDiscountPercent);
		transportVnd = String(quotation.transportVnd);
		handlingVnd = String(quotation.handlingVnd);
		addVat = quotation.vatRatePercent != null;
		vatRatePercent = quotation.vatRatePercent == null ? '' : String(quotation.vatRatePercent);
		validUntil = quotation.validUntil;
		eventName = quotation.eventName ?? '';
		eventDate = quotation.eventDate ?? '';
		venue = quotation.venue ?? '';
		notes = quotation.notes ?? '';
	});

	const totals = $derived(
		calculateQuotationTotals(
			lineItems,
			parseAmount(discountPercent),
			parseAmount(transportVnd),
			parseAmount(handlingVnd)
		)
	);
	const vatAmountVnd = $derived(
		addVat ? calculateQuotationVat(totals.totalVnd, parseAmount(vatRatePercent)) : 0
	);
	const quotationTotalVnd = $derived(totals.totalVnd + vatAmountVnd);
	const filteredCatalogueItems = $derived.by(() => {
		const search = catalogueSearch.trim().toLocaleLowerCase();
		return catalogueItems.filter((item) => {
			const matchesCategory = catalogueCategory === 'all' || item.category === catalogueCategory;
			const searchableText = [item.name, item.category, item.manufacturer, item.description]
				.filter(Boolean)
				.join(' ')
				.toLocaleLowerCase();
			return matchesCategory && (!search || searchableText.includes(search));
		});
	});
	const selectedCatalogueItemIsVisible = $derived(
		filteredCatalogueItems.some((item) => item.id === selectedCatalogueId)
	);
	const selectedCatalogueItem = $derived(
		catalogueItems.find((item) => item.id === selectedCatalogueId) ?? null
	);

	function defaultValidUntil(): string {
		const date = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
		return date.toISOString().slice(0, 10);
	}

	function parseAmount(value: string): number {
		const parsed = Number(value);
		return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
	}

	function selectClient() {
		const client = clients.find((candidate) => candidate.id === clientId);
		if (!client) return;
		leadName = '';
		leadCompanyName = '';
		leadEmail = '';
		leadPhone = '';
		leadAddress = '';
	}

	function addEquipment() {
		const item = filteredCatalogueItems.find((candidate) => candidate.id === selectedCatalogueId);
		if (!item) return;

		const existing = lineItems.findIndex((lineItem) => lineItem.catalogItemId === item.id);
		if (existing >= 0) {
			lineItems[existing].quantity += 1;
			lineItems = [...lineItems];
		} else {
			lineItems = [
				...lineItems,
				{
					catalogItemId: item.id,
					name: item.name,
					category: item.category,
					manufacturer: item.manufacturer,
					quantity: 1,
					unitPriceVnd: item.rentalRateVnd ?? 0,
					imageUrl: item.imageUrl,
					note: null
				}
			];
		}
		selectedCatalogueId = '';
	}

	function updateCatalogueSearch(event: Event) {
		catalogueSearch = (event.currentTarget as HTMLInputElement).value;
		selectedCatalogueId = '';
	}

	function updateCatalogueCategory(event: Event) {
		catalogueCategory = (event.currentTarget as HTMLSelectElement).value as
			'all' | EquipmentCategory;
		selectedCatalogueId = '';
	}

	function fallbackCatalogueImage(event: Event, originalUrl: string | null) {
		const image = event.currentTarget as HTMLImageElement;
		if (originalUrl && image.dataset.originalFallbackFor !== originalUrl) {
			image.dataset.originalFallbackFor = originalUrl;
			image.src = originalUrl;
			return;
		}
		image.hidden = true;
		image.nextElementSibling?.classList.remove('hidden');
	}

	function removeEquipment(index: number) {
		lineItems = lineItems.filter((_, itemIndex) => itemIndex !== index);
	}

	function customerSnapshot(): QuotationCustomerSnapshot | null {
		if (customerType === 'existing-client') {
			const client = clients.find((candidate) => candidate.id === clientId);
			if (!client) return null;
			return {
				type: 'existing-client',
				clientId: client.id,
				leadId: null,
				name: client.name,
				companyName: client.companyName ?? null,
				email: client.email ?? null,
				phone: client.phone ?? null,
				address: client.address ?? null
			};
		}

		if (!leadName.trim() || !leadEmail.trim()) return null;
		return {
			type: 'lead',
			clientId: null,
			leadId: leadId || null,
			name: leadName.trim(),
			companyName: leadCompanyName.trim() || null,
			email: leadEmail.trim().toLowerCase(),
			phone: leadPhone.trim() || null,
			address: leadAddress.trim() || null
		};
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		errorMessage = '';

		if (lineItems.length === 0) {
			errorMessage = 'Add at least one equipment item.';
			return;
		}
		if (addVat && !vatRatePercent.trim()) {
			errorMessage = 'Enter the VAT rate for this quotation.';
			return;
		}

		let customer = customerSnapshot();
		if (customerType === 'lead' && !customer) {
			errorMessage = 'Lead name and email are required.';
			return;
		}

		isSubmitting = true;
		try {
			if (customerType === 'lead' && customer && !leadId) {
				const createdLeadId = await saveLead({
					name: leadName.trim(),
					companyName: leadCompanyName.trim() || null,
					email: leadEmail.trim().toLowerCase(),
					phone: leadPhone.trim() || null,
					address: leadAddress.trim() || null,
					source: 'quotation',
					status: 'new'
				});
				leadId = createdLeadId;
				customer = { ...customer, leadId: createdLeadId };
			}

			if (!customer) throw new Error('Customer details are incomplete');
			const quotationInput: QuotationInput = {
				status: 'draft',
				customer,
				lineItems,
				equipmentDiscountPercent: parseAmount(discountPercent),
				transportVnd: parseAmount(transportVnd),
				handlingVnd: parseAmount(handlingVnd),
				vatRatePercent: addVat ? parseAmount(vatRatePercent) : null,
				validUntil,
				eventName: eventName.trim() || null,
				eventDate: eventDate || null,
				venue: venue.trim() || null,
				notes: notes.trim() || null
			};
			const quotationId = quotation
				? (await updateQuotation(quotation.id, quotationInput), quotation.id)
				: await saveQuotation(quotationInput);
			toast.success('Quotation saved');
			onSuccess?.(quotationId);
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to save quotation';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<form onsubmit={handleSubmit} class="space-y-6" novalidate>
	{#if errorMessage}<FormMessage message={errorMessage} />{/if}

	<FormSection title="Customer">
		<div class="grid gap-4 md:grid-cols-2">
			<div class="flex flex-col gap-1">
				<label for="customerType" class="mb-1 block text-sm font-medium">Customer type</label>
				<select
					id="customerType"
					bind:value={customerType}
					class="w-full rounded-sm bg-muted/50 px-3.5 py-2.5 text-sm"
				>
					<option value="existing-client">Existing client</option>
					<option value="lead">New lead</option>
				</select>
			</div>

			{#if customerType === 'existing-client'}
				<div class="flex flex-col gap-1">
					<label for="clientId" class="mb-1 block text-sm font-medium">Client</label>
					<select
						id="clientId"
						bind:value={clientId}
						onchange={selectClient}
						required
						class="w-full rounded-sm bg-muted/50 px-3.5 py-2.5 text-sm"
					>
						<option value="">Select a client</option>
						{#each clients as client (client.id)}
							<option value={client.id}>{client.companyName || client.name}</option>
						{/each}
					</select>
				</div>
			{:else}
				<TextField id="leadName" label="Lead name" bind:value={leadName} required />
			{/if}
		</div>

		{#if customerType === 'lead'}
			<div class="mt-4 grid gap-4 md:grid-cols-2">
				<TextField id="leadCompanyName" label="Company name" bind:value={leadCompanyName} />
				<TextField id="leadEmail" label="Email" type="email" bind:value={leadEmail} required />
				<TextField id="leadPhone" label="Phone" bind:value={leadPhone} />
				<TextField id="leadAddress" label="Address" bind:value={leadAddress} />
			</div>
		{/if}
	</FormSection>

	<FormSection title="Equipment">
		{#if catalogueItems.length === 0}
			<p class="text-sm text-destructive">
				No catalogue items are available. Configure the Insense Packages catalogue integration
				first.
			</p>
		{:else}
			<div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
				<label for="catalogueSearch" class="sr-only">Search equipment</label>
				<input
					id="catalogueSearch"
					type="search"
					placeholder="Search by name, manufacturer, or description"
					value={catalogueSearch}
					oninput={updateCatalogueSearch}
					class="w-full rounded-sm bg-muted/50 px-3.5 py-2.5 text-sm"
				/>
				<label for="catalogueCategory" class="sr-only">Filter by category</label>
				<select
					id="catalogueCategory"
					value={catalogueCategory}
					onchange={updateCatalogueCategory}
					class="w-full rounded-sm bg-muted/50 px-3.5 py-2.5 text-sm"
				>
					<option value="all">All categories</option>
					<option value="audio">Audio</option>
					<option value="lighting">Lighting</option>
					<option value="dj">DJ</option>
				</select>
			</div>
			<div class="mt-3 flex gap-2">
				<select
					aria-label="Select equipment"
					bind:value={selectedCatalogueId}
					class="min-w-0 flex-1 rounded-sm bg-muted/50 px-3.5 py-2.5 text-sm"
				>
					<option value="">Select equipment</option>
					{#each filteredCatalogueItems as item (item.id)}
						<option value={item.id}>{item.category.toUpperCase()} — {item.name}</option>
					{/each}
				</select>
				<Button
					type="button"
					variant="outline"
					onclick={addEquipment}
					disabled={!selectedCatalogueId || !selectedCatalogueItemIsVisible}
				>
					<Plus class="size-4" /> Add
				</Button>
			</div>
			{#if selectedCatalogueItem}
				<div class="mt-3 flex items-center gap-3 rounded-sm border border-border p-3">
					<div
						class="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-muted"
					>
						{#if selectedCatalogueItem.imageUrl}
							<img
								src={catalogueImageUrlForDisplay(selectedCatalogueItem.imageUrl, 240)}
								alt={selectedCatalogueItem.name}
								class="size-full object-contain"
								onerror={(event) => fallbackCatalogueImage(event, selectedCatalogueItem.imageUrl)}
							/>
							<span class="hidden px-2 text-center text-xs text-muted-foreground">
								Image unavailable
							</span>
						{:else}
							<span class="px-2 text-center text-xs text-muted-foreground">No image</span>
						{/if}
					</div>
					<div class="min-w-0">
						<div class="font-medium">{selectedCatalogueItem.name}</div>
						<div class="text-xs text-muted-foreground">
							{selectedCatalogueItem.manufacturer || selectedCatalogueItem.category}
						</div>
						{#if selectedCatalogueItem.description}
							<p class="mt-1 line-clamp-2 text-xs text-muted-foreground">
								{selectedCatalogueItem.description}
							</p>
						{/if}
					</div>
				</div>
			{/if}
			<p class="mt-2 text-xs text-muted-foreground">
				Showing {filteredCatalogueItems.length} of {catalogueItems.length} equipment items.
			</p>
			{#if filteredCatalogueItems.length === 0}
				<p class="mt-2 text-sm text-muted-foreground">No equipment matches these filters.</p>
			{/if}

			{#if lineItems.length > 0}
				<div class="mt-4 space-y-3">
					{#each lineItems as item, index (item.catalogItemId)}
						<div
							class="grid gap-3 rounded-sm border border-border p-3 md:grid-cols-[64px_1fr_100px_150px_40px] md:items-center"
						>
							<div
								class="flex size-16 items-center justify-center overflow-hidden rounded-sm bg-muted"
							>
								{#if item.imageUrl}
									<img
										src={catalogueImageUrlForDisplay(item.imageUrl, 240)}
										alt={item.name}
										class="size-full object-contain"
										onerror={(event) => fallbackCatalogueImage(event, item.imageUrl)}
									/>
									<span class="hidden px-1 text-center text-xs text-muted-foreground">
										Image unavailable
									</span>
								{:else}
									<span class="text-xs text-muted-foreground">No image</span>
								{/if}
							</div>
							<div>
								<div class="font-medium">{item.name}</div>
								<div class="text-xs text-muted-foreground">
									{item.manufacturer || item.category}
								</div>
							</div>
							<label class="text-sm"
								>Qty<input
									aria-label={`Quantity for ${item.name}`}
									type="number"
									min="1"
									bind:value={item.quantity}
									class="mt-1 w-full rounded-sm bg-muted/50 px-2 py-2"
								/></label
							>
							<label class="text-sm"
								>Unit price<input
									aria-label={`Unit price for ${item.name}`}
									type="number"
									min="0"
									step="1"
									bind:value={item.unitPriceVnd}
									class="mt-1 w-full rounded-sm bg-muted/50 px-2 py-2"
								/></label
							>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onclick={() => removeEquipment(index)}
								aria-label={`Remove ${item.name}`}><Trash2 class="size-4" /></Button
							>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</FormSection>

	<FormSection title="Pricing and validity">
		<div class="grid gap-4 md:grid-cols-3">
			<TextField
				id="discountPercent"
				label="Equipment discount (%)"
				type="number"
				min="0"
				max="100"
				step="0.01"
				bind:value={discountPercent}
			/>
			<TextField
				id="transportVnd"
				label="Transport (VND)"
				type="number"
				min="0"
				step="1"
				bind:value={transportVnd}
			/>
			<TextField
				id="handlingVnd"
				label="Handling (VND)"
				type="number"
				min="0"
				step="1"
				bind:value={handlingVnd}
			/>
			<TextField id="validUntil" label="Valid until" type="date" bind:value={validUntil} required />
		</div>
		<label class="mt-4 flex items-center gap-2 text-sm font-medium" for="addVat">
			<input id="addVat" type="checkbox" bind:checked={addVat} class="size-4 accent-primary" />
			Add VAT to this quotation
		</label>
		<p class="mt-1 text-xs text-muted-foreground">
			Default rate: {defaultVatRatePercent}%. The rate can be changed for this quotation.
		</p>
		{#if addVat}
			<div class="mt-4 max-w-xs">
				<TextField
					id="vatRatePercent"
					label="VAT rate (%)"
					type="number"
					min="0"
					max="100"
					step="0.01"
					bind:value={vatRatePercent}
					required
				/>
			</div>
		{/if}
	</FormSection>

	<FormSection title="Event details (optional)">
		<div class="grid gap-4 md:grid-cols-3">
			<TextField id="eventName" label="Event name" bind:value={eventName} />
			<TextField id="eventDate" label="Event date" type="date" bind:value={eventDate} />
			<TextField id="venue" label="Venue" bind:value={venue} />
		</div>
		<div class="mt-4">
			<TextareaField id="notes" label="Notes and terms" bind:value={notes} rows={4} />
		</div>
	</FormSection>

	<div class="rounded-sm border border-border bg-card p-4">
		<div class="flex justify-between text-sm">
			<span>Equipment subtotal</span><span>{formatCurrency(totals.equipmentSubtotalVnd)}</span>
		</div>
		<div class="mt-2 flex justify-between text-sm">
			<span>Equipment discount</span><span>- {formatCurrency(totals.equipmentDiscountVnd)}</span>
		</div>
		<div class="mt-2 flex justify-between text-sm">
			<span>Transport and handling</span><span
				>{formatCurrency(parseAmount(transportVnd) + parseAmount(handlingVnd))}</span
			>
		</div>
		{#if addVat}
			<div class="mt-2 flex justify-between text-sm">
				<span>VAT ({parseAmount(vatRatePercent)}%)</span><span>{formatCurrency(vatAmountVnd)}</span>
			</div>
		{/if}
		<div class="mt-4 flex justify-between border-t border-border pt-4 text-lg font-semibold">
			<span>{addVat ? 'Total including VAT' : 'Total'}</span><span
				>{formatCurrency(quotationTotalVnd)}</span
			>
		</div>
	</div>

	<div class="flex justify-end gap-2">
		<Button
			type="button"
			variant="outline"
			onclick={() => onCancel?.() ?? goto(resolve('/quotations'))}>Cancel</Button
		>
		<Button type="submit" disabled={isSubmitting || catalogueItems.length === 0}
			>{isSubmitting ? 'Saving…' : 'Save quotation'}</Button
		>
	</div>
</form>
