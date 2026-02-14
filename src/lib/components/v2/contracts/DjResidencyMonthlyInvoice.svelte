<script lang="ts">
	import type {
		DjResidencyContract,
		ClientCounterparty,
		PerformanceLog,
		MonthlyInvoice,
		PerformerContractor
	} from '$lib/types/v2';
	import {
		subscribeToPerformances,
		subscribeToInvoices,
		addMonthlyInvoice,
		markPerformancesAsInvoiced,
		updateInvoiceStatus,
		addServiceContractToInvoice
	} from '$lib/utils/v2/djResidencyContracts';
	import { getCounterpartyById } from '$lib/utils/v2/counterparties';
	import { saveServiceProvisionContract } from '$lib/utils/v2/serviceProvisionContracts';
	import { createOneTimePayment } from '$lib/utils/v2/payments';
	import { authState } from '$lib/state/auth.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { FileText } from 'lucide-svelte';
	import { formatCurrency, formatDateString } from '$lib/utils/formatting';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import type { Unsubscribe } from 'firebase/firestore';

	interface Props {
		contract: DjResidencyContract;
		venueCounterparty: ClientCounterparty;
	}

	let { contract, venueCounterparty }: Props = $props();

	// State
	let performances = $state<PerformanceLog[]>([]);
	let invoices = $state<MonthlyInvoice[]>([]);
	let isLoading = $state(true);
	let isGenerating = $state(false);
	let selectedMonth = $state('');

	let unsubscribePerformances: Unsubscribe | null = null;
	let unsubscribeInvoices: Unsubscribe | null = null;

	onMount(() => {
		unsubscribePerformances = subscribeToPerformances(
			contract.id,
			(data) => {
				performances = data;
				isLoading = false;
			},
			(error) => {
				toast.error('Failed to load performances');
				isLoading = false;
			}
		);

		unsubscribeInvoices = subscribeToInvoices(
			contract.id,
			(data) => {
				invoices = data;
			},
			(error) => {
				toast.error('Failed to load invoices');
			}
		);

		return () => {
			unsubscribePerformances?.();
			unsubscribeInvoices?.();
		};
	});

	// Get uninvoiced performances
	let uninvoicedPerformances = $derived(performances.filter((p) => !p.invoiced));

	// Group uninvoiced performances by month
	let performancesByMonth = $derived.by(() => {
		const grouped: Record<string, PerformanceLog[]> = {};
		for (const perf of uninvoicedPerformances) {
			const month = perf.date.substring(0, 7); // YYYY-MM
			if (!grouped[month]) {
				grouped[month] = [];
			}
			grouped[month].push(perf);
		}
		return grouped;
	});

	// Get available months for invoicing
	let availableMonths = $derived(Object.keys(performancesByMonth).sort());

	// Get performances for selected month grouped by performer
	let selectedMonthPerformances = $derived(
		selectedMonth ? performancesByMonth[selectedMonth] || [] : []
	);

	let performancesByPerformer = $derived.by(() => {
		const grouped: Record<string, { performerName: string; performances: PerformanceLog[] }> = {};
		for (const perf of selectedMonthPerformances) {
			if (!grouped[perf.performerId]) {
				grouped[perf.performerId] = {
					performerName: perf.performerName,
					performances: []
				};
			}
			grouped[perf.performerId].performances.push(perf);
		}
		return grouped;
	});

	// Calculate total for selected month
	let selectedMonthTotal = $derived(
		selectedMonthPerformances.reduce(
			(sum, p) => sum + p.setsCompleted * contract.performanceFeeVND,
			0
		)
	);

	function formatMonthLabel(month: string): string {
		const [year, monthNum] = month.split('-');
		const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
		return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
	}

	function getInvoiceDueDate(invoiceDate: string): string {
		const date = new Date(invoiceDate);
		date.setDate(date.getDate() + 14); // 2 weeks after invoice date
		return date.toISOString().split('T')[0];
	}

	/**
	 * Validate that a performer has all required payment fields
	 */
	function validatePerformerPaymentFields(
		performer: PerformerContractor
	): { valid: true } | { valid: false; missing: string[] } {
		const missing: string[] = [];

		if (!performer.email) missing.push('email');
		if (!performer.phone) missing.push('phone');
		if (!performer.bankName) missing.push('bank name');
		if (!performer.bankAccountNumber) missing.push('bank account number');
		if (!performer.idDocument) missing.push('ID document');

		if (missing.length > 0) {
			return { valid: false, missing };
		}
		return { valid: true };
	}

	async function handleGenerateInvoice() {
		if (!selectedMonth || selectedMonthPerformances.length === 0) {
			toast.error('Please select a month with performances');
			return;
		}

		if (!authState.user) {
			toast.error('You must be logged in');
			return;
		}

		isGenerating = true;
		try {
			// First, fetch and validate all performer data
			const performerIds = Object.keys(performancesByPerformer);
			const performerDataMap: Map<string, PerformerContractor> = new Map();
			const invalidPerformers: { name: string; missing: string[] }[] = [];

			for (const performerId of performerIds) {
				const performer = await getCounterpartyById(performerId);

				if (!performer || performer.type !== 'contractor') {
					invalidPerformers.push({
						name: performancesByPerformer[performerId].performerName,
						missing: ['performer record not found']
					});
					continue;
				}

				const validation = validatePerformerPaymentFields(performer as PerformerContractor);
				if (!validation.valid) {
					invalidPerformers.push({
						name: performer.name,
						missing: validation.missing
					});
				} else {
					performerDataMap.set(performerId, performer as PerformerContractor);
				}
			}

			// If any performers are missing required data, show error and abort
			if (invalidPerformers.length > 0) {
				const errorMessages = invalidPerformers
					.map((p) => `${p.name}: missing ${p.missing.join(', ')}`)
					.join('\n');
				toast.error(
					`Cannot generate invoice. Please update performer payment details:\n${errorMessages}`
				);
				isGenerating = false;
				return;
			}

			const invoiceDate = new Date().toISOString().split('T')[0];
			const paymentDueDate = getInvoiceDueDate(invoiceDate);

			// Create the monthly invoice record
			const invoiceId = await addMonthlyInvoice(contract.id, {
				month: selectedMonth,
				totalPerformances: selectedMonthPerformances.length,
				totalAmount: selectedMonthTotal,
				serviceContractIds: [],
				invoiceDate,
				paymentDueDate,
				status: 'draft'
			});

			// Create Service Provision contracts for each performer
			const serviceContractIds: string[] = [];

			for (const [performerId, perfData] of Object.entries(performancesByPerformer)) {
				const performer = performerDataMap.get(performerId)!;
				const totalSets = perfData.performances.reduce((sum, p) => sum + p.setsCompleted, 0);
				const totalAmount = totalSets * contract.performanceFeeVND;

				// Calculate date range for performances
				const dates = perfData.performances.map((p) => p.date).sort();
				const startDate = dates[0];
				const endDate = dates[dates.length - 1];

				// Create Service Provision contract with real performer data
				const syntheticEventId = `djr-${contract.id}-${selectedMonth}`;
				const eventName = `DJ Residency ${formatMonthLabel(selectedMonth)}`;

				const contractId = await saveServiceProvisionContract({
					type: 'service-provision',
					ownerUid: authState.user.uid,
					contractNumber: `${contract.contractNumber}-${selectedMonth}-${performerId.slice(-4)}`,
					eventId: syntheticEventId,
					counterpartyId: performerId,
					counterpartyName: performer.stageName || performer.name,
					eventName,
					paymentDirection: 'payable',
					paymentStatus: 'unpaid',
					contractValue: totalAmount,
					currency: 'VND',
					notes: `Generated from DJ Residency contract ${contract.contractNumber}`,
					jobName: 'DJ Performance',
					jobContent: `${totalSets} DJ sets at ${venueCounterparty.companyName || venueCounterparty.name}`,
					numberOfPerformances: totalSets,
					firstPerformanceTime: '20:00',
					startDate,
					endDate,
					taxRate: 10,
					netFee: totalAmount * 0.9,
					status: 'generated',
					// Use real performer payment data
					bankName: performer.bankName!,
					accountNumber: performer.bankAccountNumber!,
					clientEmail: performer.email!,
					clientAddress: performer.address || venueCounterparty.address || '',
					clientPhone: performer.phone!,
					clientIdDocument: performer.idDocument!,
					clientTaxId: performer.taxId || null,
					eventLocation: venueCounterparty.address || '',
					paymentDueDate
				});

				serviceContractIds.push(contractId);

				// Create payment record for the service contract
				await createOneTimePayment(
					{
						id: contractId,
						type: 'service-provision',
						contractNumber: `${contract.contractNumber}-${selectedMonth}-${performerId.slice(-4)}`,
						counterpartyName: performer.stageName || performer.name,
						paymentDirection: 'payable',
						paymentStatus: 'unpaid',
						contractValue: totalAmount,
						currency: 'VND',
						ownerUid: authState.user.uid,
						eventId: null,
						counterpartyId: performerId,
						eventName: null,
						createdAt: null as any,
						updatedAt: null as any,
						paidAt: null,
						paidBy: null,
						notes: null
					},
					paymentDueDate
				);

				// Link service contract to invoice
				await addServiceContractToInvoice(contract.id, invoiceId, contractId);
			}

			// Mark performances as invoiced
			const performanceIds = selectedMonthPerformances.map((p) => p.id);
			await markPerformancesAsInvoiced(contract.id, performanceIds, selectedMonth);

			// Update invoice status to issued
			await updateInvoiceStatus(contract.id, invoiceId, 'issued');

			toast.success(
				`Invoice generated! Created ${serviceContractIds.length} service contract(s) for ${formatMonthLabel(selectedMonth)}`
			);
			selectedMonth = '';
		} catch (error) {
			console.error('Invoice generation error:', error);
			toast.error('Failed to generate invoice');
		} finally {
			isGenerating = false;
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'paid':
				return 'bg-emerald-500';
			case 'issued':
				return 'bg-blue-500';
			default:
				return 'bg-gray-500';
		}
	}
</script>

<div class="bg-white rounded-lg border border-gray-200 p-6">
	<h3 class="text-lg font-semibold text-gray-900 mb-6">Monthly Invoicing</h3>

	{#if isLoading}
		<div class="text-center py-8 text-gray-500">Loading...</div>
	{:else}
		<!-- Generate Invoice Section -->
		{#if availableMonths.length > 0}
			<div class="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
				<h4 class="font-medium text-blue-900 mb-3">Generate Monthly Invoice</h4>
				<div class="flex flex-wrap items-end gap-4">
					<div class="flex-1 min-w-48">
						<label for="selectedMonth" class="block text-sm font-medium text-blue-800 mb-1">
							Select Month
						</label>
						<select
							id="selectedMonth"
							bind:value={selectedMonth}
							class="w-full px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 bg-white"
						>
							<option value="">Choose a month...</option>
							{#each availableMonths as month (month)}
								<option value={month}>
									{formatMonthLabel(month)} ({performancesByMonth[month].length} performances)
								</option>
							{/each}
						</select>
					</div>

					{#if selectedMonth}
						<div class="text-sm text-blue-800">
							<p><strong>Total:</strong> {formatCurrency(selectedMonthTotal)}</p>
							<p><strong>Performers:</strong> {Object.keys(performancesByPerformer).length}</p>
						</div>
					{/if}

					<Button
						variant="dark"
						onclick={handleGenerateInvoice}
						disabled={!selectedMonth || isGenerating}
					>
						{#if isGenerating}
							<span class="animate-spin mr-2">⏳</span>
							Generating...
						{:else}
							<FileText class="w-4 h-4 mr-2" />
							Generate Invoice
						{/if}
					</Button>
				</div>

				{#if selectedMonth && Object.keys(performancesByPerformer).length > 0}
					<div class="mt-4 pt-4 border-t border-blue-200">
						<p class="text-sm font-medium text-blue-800 mb-2">Service contracts will be created for:</p>
						<div class="space-y-1">
							{#each Object.entries(performancesByPerformer) as [performerId, data] (performerId)}
								{@const totalSets = data.performances.reduce((sum, p) => sum + p.setsCompleted, 0)}
								<div class="flex justify-between text-sm text-blue-700">
									<span>{data.performerName} ({totalSets} sets)</span>
									<span>{formatCurrency(totalSets * contract.performanceFeeVND)}</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<div class="bg-gray-50 rounded-lg p-4 mb-6 text-center text-gray-600">
				No uninvoiced performances available. Log performances first.
			</div>
		{/if}

		<!-- Invoice History -->
		<h4 class="font-medium text-gray-900 mb-3">Invoice History</h4>
		{#if invoices.length === 0}
			<div class="text-center py-6 text-gray-500">No invoices generated yet.</div>
		{:else}
			<div class="space-y-3">
				{#each invoices as invoice (invoice.id)}
					<div class="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-gray-50">
						<div class="flex items-center gap-4">
							<div>
								<p class="font-medium text-gray-900">{formatMonthLabel(invoice.month)}</p>
								<p class="text-sm text-gray-500">
									{invoice.totalPerformances} performances · Issued {formatDateString(invoice.invoiceDate)}
								</p>
							</div>
						</div>
						<div class="flex items-center gap-4">
							<div class="text-right">
								<p class="font-medium text-emerald-600">{formatCurrency(invoice.totalAmount)}</p>
								<p class="text-sm text-gray-500">
									Due {formatDateString(invoice.paymentDueDate)}
								</p>
							</div>
							<Badge class={getStatusColor(invoice.status)}>
								{invoice.status}
							</Badge>
							{#if invoice.serviceContractIds.length > 0}
								<span class="text-xs text-gray-500">
									{invoice.serviceContractIds.length} contract(s)
								</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>
