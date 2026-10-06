<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { ChevronDown, Plus, Trash2 } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import type {
		ClientCounterparty,
		EquipmentCatalogueItem,
		Quotation,
		QuotationInput,
		QuotationLineItem,
		QuotationCustomerSnapshot,
		QuotationPackageCatalogueItem,
		QuotationPackageSnapshot
	} from '$lib/types/v2';
	import { saveLead } from '$lib/utils/v2/leads';
	import { saveQuotation, updateQuotation } from '$lib/utils/v2/quotations';
	import { getQuotationSettings } from '$lib/utils/v2/appConfig';
	import {
		calculateQuotationTotals,
		calculateQuotationVat,
		calculatePackageQuotePrice
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
		cataloguePackages: QuotationPackageCatalogueItem[];
		catalogueSupportsPackages: boolean;
		catalogueError: string | null;
		quotation?: Quotation;
		onSuccess?: (quotationId: string) => void;
		onCancel?: () => void;
	}

	let {
		clients,
		catalogueItems,
		cataloguePackages,
		catalogueSupportsPackages,
		catalogueError,
		quotation,
		onSuccess,
		onCancel
	}: Props = $props();

	let customerType = $state<'existing-client' | 'lead'>('existing-client');
	let clientId = $state('');
	let leadId = $state('');
	let leadName = $state('');
	let leadCompanyName = $state('');
	let leadEmail = $state('');
	let leadPhone = $state('');
	let leadAddress = $state('');
	let selectedPackageSlug = $state('');
	let expectedGuests = $state('');
	let packageDiscountPercent = $state('0');
	let packageSnapshot = $state<QuotationPackageSnapshot | null>(null);
	let packageDialog = $state<HTMLDialogElement | null>(null);
	let expandedPackageSlug = $state('');
	let equipmentDialog = $state<HTMLDialogElement | null>(null);
	let equipmentSelection = $state<Record<string, { checked: boolean; quantity: number }>>({});
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
	const selectedPackage = $derived(
		cataloguePackages.find((item) => item.slug === selectedPackageSlug) ?? null
	);
	const packageForDisplay = $derived(packageSnapshot ?? selectedPackage);
	const packageExpectedGuests = $derived(
		Math.max(1, Math.floor(parseAmount(expectedGuests) || selectedPackage?.guestRange.min || 1))
	);
	const quotedPackagePriceVnd = $derived(
		packageSnapshot?.quotedPriceVnd ??
			(selectedPackage ? calculatePackageQuotePrice(selectedPackage, packageExpectedGuests) : 0)
	);

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
		packageSnapshot = quotation.packageSnapshot ?? null;
		selectedPackageSlug = packageSnapshot?.slug ?? '';
		expectedGuests = packageSnapshot ? String(packageSnapshot.expectedGuests) : '';
		packageDiscountPercent = String(quotation.packageDiscountPercent ?? 0);
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
			parseAmount(handlingVnd),
			quotedPackagePriceVnd,
			parseAmount(packageDiscountPercent)
		)
	);
	const vatAmountVnd = $derived(
		addVat ? calculateQuotationVat(totals.totalVnd, parseAmount(vatRatePercent)) : 0
	);
	const quotationTotalVnd = $derived(totals.totalVnd + vatAmountVnd);
	const selectedEquipmentCount = $derived(
		Object.values(equipmentSelection).filter((selection) => selection.checked).length
	);

	function choosePackage(item: QuotationPackageCatalogueItem) {
		const packageChanged = selectedPackageSlug !== item.slug;
		selectedPackageSlug = item.slug;
		packageSnapshot = null;
		if (packageChanged || !expectedGuests) expectedGuests = String(item.guestRange.min);
		packageDialog?.close();
	}

	function removePackage() {
		selectedPackageSlug = '';
		packageSnapshot = null;
		expectedGuests = '';
	}

	function togglePackageDetails(slug: string) {
		expandedPackageSlug = expandedPackageSlug === slug ? '' : slug;
	}

	function changeExpectedGuests() {
		packageSnapshot = null;
	}

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

	function openEquipmentDialog() {
		const currentLines = new Map(lineItems.map((item) => [item.catalogItemId, item]));
		equipmentSelection = Object.fromEntries(
			catalogueItems.map((item) => {
				const currentLine = currentLines.get(item.id);
				return [item.id, { checked: Boolean(currentLine), quantity: currentLine?.quantity ?? 1 }];
			})
		);
		equipmentDialog?.showModal();
	}

	function applyEquipmentSelection() {
		const currentLines = new Map(lineItems.map((item) => [item.catalogItemId, item]));
		const catalogueIds = new Set(catalogueItems.map((item) => item.id));
		const selectedLines = catalogueItems.flatMap((item) => {
			const selection = equipmentSelection[item.id];
			if (!selection?.checked) return [];

			const currentLine = currentLines.get(item.id);
			return [
				{
					catalogItemId: item.id,
					name: item.name,
					category: item.category,
					manufacturer: item.manufacturer,
					quantity: Math.max(1, Math.floor(selection.quantity || 1)),
					unitPriceVnd: currentLine?.unitPriceVnd ?? item.rentalRateVnd ?? 0,
					imageUrl: item.imageUrl,
					note: currentLine?.note ?? null
				}
			];
		});
		lineItems = [
			...selectedLines,
			...lineItems.filter((item) => !catalogueIds.has(item.catalogItemId))
		];
		equipmentDialog?.close();
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

		if (lineItems.length === 0 && !selectedPackage && !packageSnapshot) {
			errorMessage = 'Select a package or add at least one equipment item.';
			return;
		}
		if (selectedPackage && (!String(expectedGuests).trim() || packageExpectedGuests < 1)) {
			errorMessage = 'Enter the expected number of guests for the selected package.';
			return;
		}
		if (selectedPackage) {
			const guests = Number(expectedGuests);
			if (!Number.isInteger(guests) || guests < selectedPackage.guestRange.min) {
				errorMessage = `Expected guests must be at least ${selectedPackage.guestRange.min}.`;
				return;
			}
			if (selectedPackage.guestRange.max !== null && guests > selectedPackage.guestRange.max) {
				errorMessage = `Expected guests cannot exceed ${selectedPackage.guestRange.max} for this package.`;
				return;
			}
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
				packageSnapshot:
					selectedPackage && !packageSnapshot
						? {
								...selectedPackage,
								expectedGuests: packageExpectedGuests,
								quotedPriceVnd: quotedPackagePriceVnd
							}
						: packageSnapshot,
				packageDiscountPercent: parseAmount(packageDiscountPercent),
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

	<FormSection title="Package">
		{#if catalogueError}
			<p class="text-sm text-destructive">Catalogue unavailable: {catalogueError}</p>
		{:else if !catalogueSupportsPackages}
			<p class="text-sm text-destructive">
				The connected catalogue API only returns equipment. Deploy the latest Insense Packages API
				to enable package quotations.
			</p>
		{:else if cataloguePackages.length === 0}
			<p class="text-sm text-muted-foreground">
				No active packages were returned by the connected catalogue.
			</p>
		{:else}
			<Button type="button" variant="outline" onclick={() => packageDialog?.showModal()}>
				{selectedPackage || packageSnapshot ? 'Change package' : 'Select a package'}
			</Button>
		{/if}

		{#if packageForDisplay}
			<div class="mt-4 space-y-4 rounded-sm border border-border p-4">
				<div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-end">
					<div>
						<div class="flex items-start justify-between gap-3">
							<h3 class="font-semibold">{packageForDisplay.name}</h3>
							<Button type="button" variant="ghost" size="sm" onclick={removePackage}>
								Remove package
							</Button>
						</div>
						<p class="mt-1 text-sm text-muted-foreground">{packageForDisplay.description}</p>
						<p class="mt-2 text-xs text-muted-foreground">
							Capacity: {packageForDisplay.guestRange.min}–{packageForDisplay.guestRange.max ??
								`${packageForDisplay.guestRange.min}+`} guests. Price range: {formatCurrency(
								packageForDisplay.priceRange.minVND
							)}–{formatCurrency(packageForDisplay.priceRange.maxVND)}.
						</p>
					</div>
					{#if selectedPackage}
						<TextField
							id="expectedGuests"
							label="Expected guests"
							type="number"
							min={selectedPackage.guestRange.min}
							max={selectedPackage.guestRange.max ?? undefined}
							step="1"
							bind:value={expectedGuests}
							oninput={changeExpectedGuests}
						/>
					{:else}
						<div class="text-sm">
							<div class="text-xs text-muted-foreground">Expected guests</div>
							<div class="mt-1 font-medium">{packageSnapshot?.expectedGuests}</div>
						</div>
					{/if}
				</div>

				<div class="flex flex-wrap items-end justify-between gap-4 border-t border-border pt-3">
					<div>
						<div class="text-xs text-muted-foreground">
							Package price for {selectedPackage
								? packageExpectedGuests
								: (packageSnapshot?.expectedGuests ?? 0)} guests
						</div>
						<div class="text-lg font-semibold">{formatCurrency(quotedPackagePriceVnd)}</div>
					</div>
					{#if packageForDisplay}
						<TextField
							id="packageDiscountPercent"
							label="Package discount (%)"
							type="number"
							min="0"
							max="100"
							step="0.01"
							bind:value={packageDiscountPercent}
						/>
					{/if}
				</div>
				{#if packageDiscountPercent !== '0' && parseAmount(packageDiscountPercent) > 0}
					<p class="text-sm text-muted-foreground">
						Package discount: {formatCurrency(totals.packageDiscountVnd)}
					</p>
				{/if}

				<div class="grid gap-4 md:grid-cols-2">
					<div>
						<h4 class="mb-2 text-sm font-medium">Included equipment</h4>
						<ul class="space-y-2">
							{#each packageForDisplay.equipment as item, index (`${item.category}-${item.name}-${index}`)}
								<li class="flex items-center gap-2 text-sm">
									<div class="size-16 shrink-0 overflow-hidden rounded-sm bg-neutral-900">
										{#if item.imageUrl}
											<img
												src={catalogueImageUrlForDisplay(item.imageUrl, 160)}
												alt=""
												class="size-full object-cover"
												onerror={(event) => fallbackCatalogueImage(event, item.imageUrl)}
											/>
											<span class="hidden size-full bg-neutral-900" aria-hidden="true"></span>
										{/if}
									</div>
									<span>{item.quantity} × {item.name}</span>
								</li>
							{/each}
						</ul>
					</div>
					<div>
						<h4 class="mb-2 text-sm font-medium">Included crew</h4>
						<ul class="space-y-1 text-sm">
							{#each packageForDisplay.crew as member (`${member.label}-${member.count}`)}
								<li>{member.count} × {member.label}</li>
							{/each}
						</ul>
					</div>
				</div>
			</div>
		{/if}
	</FormSection>

	<FormSection title="Additional equipment">
		{#if catalogueItems.length === 0}
			<p class="text-sm text-muted-foreground">No additional equipment is available.</p>
		{:else}
			<Button type="button" variant="outline" onclick={openEquipmentDialog}>
				<Plus class="size-4" /> Select Equipment
			</Button>
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
										class="size-full object-cover"
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
		{#if totals.packageSubtotalVnd > 0}
			<div class="flex justify-between text-sm">
				<span>Package</span><span>{formatCurrency(totals.packageSubtotalVnd)}</span>
			</div>
			{#if totals.packageDiscountVnd > 0}
				<div class="mt-2 flex justify-between text-sm">
					<span>Package discount ({parseAmount(packageDiscountPercent)}%)</span><span
						>- {formatCurrency(totals.packageDiscountVnd)}</span
					>
				</div>
			{/if}
		{/if}
		<div class="flex justify-between text-sm">
			<span>Additional equipment</span><span>{formatCurrency(totals.equipmentSubtotalVnd)}</span>
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
		<Button
			type="submit"
			disabled={isSubmitting || (catalogueItems.length === 0 && cataloguePackages.length === 0)}
			>{isSubmitting ? 'Saving…' : 'Save quotation'}</Button
		>
	</div>
</form>

<dialog
	bind:this={packageDialog}
	aria-labelledby="package-dialog-title"
	class="m-auto max-h-[85vh] w-[min(96vw,900px)] max-w-none overflow-hidden rounded-sm bg-background p-0 text-foreground shadow-xl backdrop:bg-black/50"
>
	<div class="flex max-h-[85vh] flex-col">
		<header class="flex items-start justify-between border-b border-border px-5 py-4">
			<div>
				<h3 id="package-dialog-title" class="text-lg font-semibold">Select a package</h3>
				<p class="mt-1 text-sm text-muted-foreground">
					Expand a package to review its included equipment and crew.
				</p>
			</div>
			<Button type="button" variant="outline" onclick={() => packageDialog?.close()}>Close</Button>
		</header>
		<div class="min-h-0 space-y-2 overflow-y-auto px-5 py-4">
			{#each cataloguePackages as item (item.slug)}
				<section class="overflow-hidden rounded-sm border border-border">
					<button
						type="button"
						class="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-muted/50"
						aria-expanded={expandedPackageSlug === item.slug}
						aria-controls="package-details-{item.slug}"
						onclick={() => togglePackageDetails(item.slug)}
					>
						<span class="min-w-0">
							<span class="block font-medium">{item.name}</span>
							<span class="mt-0.5 block truncate text-sm text-muted-foreground">{item.tagline}</span
							>
						</span>
						<ChevronDown
							class={`size-4 shrink-0 transition-transform ${expandedPackageSlug === item.slug ? 'rotate-180' : ''}`}
						/>
					</button>
					{#if expandedPackageSlug === item.slug}
						<div id="package-details-{item.slug}" class="border-t border-border p-4">
							<p class="text-sm text-muted-foreground">{item.description}</p>
							<p class="mt-2 text-xs text-muted-foreground">
								{item.guestRange.min}{item.guestRange.max === null
									? '+'
									: `–${item.guestRange.max}`} guests · {formatCurrency(
									item.priceRange.minVND
								)}–{formatCurrency(item.priceRange.maxVND)}
							</p>
							<ul class="mt-4 space-y-2">
								{#each item.equipment as equipment, index (`${equipment.category}-${equipment.name}-${index}`)}
									<li class="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-3">
										<div
											class="size-16 shrink-0 overflow-hidden rounded-sm bg-neutral-900"
											data-testid={!equipment.imageUrl ? 'package-image-placeholder' : undefined}
											aria-hidden={!equipment.imageUrl}
										>
											{#if equipment.imageUrl}
												<img
													src={catalogueImageUrlForDisplay(equipment.imageUrl, 160)}
													alt=""
													class="size-full object-cover"
													onerror={(event) => fallbackCatalogueImage(event, equipment.imageUrl)}
												/>
												<span class="hidden size-full bg-neutral-900" aria-hidden="true"></span>
											{/if}
										</div>
										<div class="min-w-0">
											<div class="font-medium">{equipment.quantity} × {equipment.name}</div>
											<div class="text-xs text-muted-foreground">
												{equipment.manufacturer || equipment.category}
											</div>
										</div>
									</li>
								{/each}
							</ul>
							{#if item.crew.length > 0}
								<p class="mt-3 text-xs text-muted-foreground">
									Crew: {item.crew.map((member) => `${member.count} × ${member.label}`).join(', ')}
								</p>
							{/if}
							<div class="mt-4 flex justify-end">
								<Button type="button" onclick={() => choosePackage(item)}>
									Select this package
								</Button>
							</div>
						</div>
					{/if}
				</section>
			{/each}
		</div>
	</div>
</dialog>

<dialog
	bind:this={equipmentDialog}
	aria-labelledby="equipment-dialog-title"
	class="m-auto max-h-[85vh] w-[min(96vw,900px)] max-w-none overflow-hidden rounded-sm bg-background p-0 text-foreground shadow-xl backdrop:bg-black/50"
>
	<div class="flex max-h-[85vh] flex-col">
		<header class="flex items-start justify-between border-b border-border px-5 py-4">
			<div>
				<h3 id="equipment-dialog-title" class="text-lg font-semibold">Select Equipment</h3>
				<p class="mt-1 text-sm text-muted-foreground">
					Choose items and set the quantity for this quotation.
				</p>
			</div>
			<Button type="button" variant="outline" onclick={() => equipmentDialog?.close()}>
				Cancel
			</Button>
		</header>
		<div class="min-h-0 overflow-y-auto px-5 py-3">
			<div class="space-y-2">
				{#each catalogueItems as item (item.id)}
					{#if equipmentSelection[item.id]}
						<div
							class="grid grid-cols-[auto_64px_minmax(0,1fr)_100px] items-center gap-3 rounded-sm border border-border p-2.5"
						>
							<input
								id="equipment-{item.id}"
								aria-label="Select {item.name}"
								type="checkbox"
								bind:checked={equipmentSelection[item.id].checked}
								class="size-4 accent-primary"
							/>
							<div
								class="flex size-16 items-center justify-center overflow-hidden rounded-sm bg-muted"
							>
								{#if item.imageUrl}
									<img
										src={catalogueImageUrlForDisplay(item.imageUrl, 160)}
										alt={item.name}
										class="size-full object-cover"
										onerror={(event) => fallbackCatalogueImage(event, item.imageUrl)}
									/>
									<span class="hidden px-1 text-center text-xs text-muted-foreground"
										>Image unavailable</span
									>
								{:else}
									<span class="px-1 text-center text-xs text-muted-foreground">No image</span>
								{/if}
							</div>
							<div class="min-w-0">
								<div class="text-xs font-medium uppercase text-muted-foreground">
									{item.category}
								</div>
								<div class="truncate font-medium">{item.name}</div>
								<div class="truncate text-xs text-muted-foreground">
									{item.manufacturer || item.description || '—'}
								</div>
							</div>
							<label for="quantity-{item.id}" class="text-xs text-muted-foreground">
								Qty
								<input
									id="quantity-{item.id}"
									aria-label="Quantity for {item.name}"
									type="number"
									min="1"
									step="1"
									bind:value={equipmentSelection[item.id].quantity}
									class="mt-1 w-full rounded-sm bg-muted/50 px-2 py-2 text-sm text-foreground"
								/>
							</label>
						</div>
					{/if}
				{/each}
			</div>
		</div>
		<footer class="flex items-center justify-between border-t border-border px-5 py-4">
			<span class="text-sm text-muted-foreground">{selectedEquipmentCount} selected</span>
			<Button type="button" onclick={applyEquipmentSelection}>Apply Selection</Button>
		</footer>
	</div>
</dialog>
