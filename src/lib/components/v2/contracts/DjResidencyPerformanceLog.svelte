<script lang="ts">
	import type { DjResidencyContract, PerformanceLog } from '$lib/types/v2';
	import {
		subscribeToPerformances,
		addPerformance,
		updatePerformance,
		deletePerformance
	} from '$lib/utils/v2/djResidencyContracts';
	import { saveCounterparty } from '$lib/utils/v2/counterparties';
	import { performerContractorSchema } from '$lib/schemas/v2/counterparty';
	import type { PerformerContractorInput } from '$lib/schemas/v2/counterparty';
	import { counterpartyState } from '$lib/state/v2';
	import { authState } from '$lib/state/auth.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Plus, Trash2, Pencil, Calendar, Clock, User } from 'lucide-svelte';
	import { formatCurrency, formatDateString } from '$lib/utils/formatting';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import { Timestamp, type Unsubscribe } from 'firebase/firestore';
	import { logger } from '$lib/utils/logger';
	import CreatePerformerInline from './sections/CreatePerformerInline.svelte';
	import { companyConfig } from '$lib/config/company';

	interface Props {
		contract: DjResidencyContract;
	}

	let { contract }: Props = $props();

	// State
	let performances = $state<PerformanceLog[]>([]);
	let isLoading = $state(true);
	let showAddForm = $state(false);
	let isSubmitting = $state(false);
	let showCreatePerformer = $state(false);

	// Edit state — only uninvoiced performances can be edited
	let editingId = $state<string | null>(null);
	let editDate = $state('');
	let editPerformerId = $state('');
	let editHoursWorked = $state(0);
	let editSetsCompleted = $state(0);
	let editPerformerSharePercentage = $state(60);
	let editNotes = $state('');
	let isEditSubmitting = $state(false);

	let editPerformerPayVND = $derived(
		Math.round(editHoursWorked * contract.performanceFeeVND * (editPerformerSharePercentage / 100))
	);

	// Inline performer creation form state
	let newPerformer = $state({
		name: '',
		stageName: '',
		performerType: 'DJ',
		genre: '',
		email: '',
		phone: '',
		bankName: '',
		bankAccountNumber: '',
		idDocument: '',
		taxId: '',
		pitRate: String(companyConfig.defaultPerformerPitRate),
		pitRatePolicy: companyConfig.defaultPerformerPitRatePolicy,
		isSubmitting: false
	});

	let performanceDate = $state('');
	let performerId = $state('');
	let hoursWorked = $state(0);
	let setsCompleted = $state(1);
	let performerSharePercentage = $state(60);
	let notes = $state('');

	// Computed performer pay for this log entry — internal only
	let performerPayVND = $derived(
		Math.round(hoursWorked * contract.performanceFeeVND * (performerSharePercentage / 100))
	);

	// Get performer counterparties
	let performerCounterparties = $derived(
		counterpartyState.performers
	);

	let unsubscribe: Unsubscribe | null = null;

	onMount(() => {
		counterpartyState.init();
		// Initialize form fields — default to 1 set per log entry
		setsCompleted = 1;
		hoursWorked = contract.performanceHoursPerSet;
		performerSharePercentage = 60;

		unsubscribe = subscribeToPerformances(
			contract.id,
			(data) => {
				performances = data;
				isLoading = false;
			},
			(error) => {
				toast.error('Failed to load performances: ' + error.message);
				isLoading = false;
			}
		);

		return () => {
			unsubscribe?.();
			counterpartyState.destroy();
		};
	});

	// DJ pay total — matches the service contract amounts
	let totalAmount = $derived(
		performances.reduce((sum, p) => sum + (p.performerPayVND ?? 0), 0)
	);

	function resetForm() {
		performanceDate = '';
		performerId = '';
		setsCompleted = 1;
		hoursWorked = contract.performanceHoursPerSet;
		performerSharePercentage = 60;
		notes = '';
		showAddForm = false;
	}

	function resetNewPerformerForm() {
		newPerformer.name = '';
		newPerformer.stageName = '';
		newPerformer.performerType = 'DJ';
		newPerformer.genre = '';
		newPerformer.email = '';
		newPerformer.phone = '';
		newPerformer.bankName = '';
		newPerformer.bankAccountNumber = '';
		newPerformer.idDocument = '';
		newPerformer.taxId = '';
		newPerformer.pitRate = String(companyConfig.defaultPerformerPitRate);
		newPerformer.pitRatePolicy = companyConfig.defaultPerformerPitRatePolicy;
		showCreatePerformer = false;
	}

	async function handleCreatePerformer() {
		if (!authState.user) {
			toast.error('You must be logged in to create a performer');
			return;
		}

		if (!newPerformer.name) {
			toast.error('Please enter the performer name');
			return;
		}

		if (!newPerformer.stageName) {
			toast.error('Please enter a stage name');
			return;
		}

		if (!newPerformer.performerType) {
			toast.error('Please enter the performer type');
			return;
		}

		newPerformer.isSubmitting = true;
		try {
			const performerData: PerformerContractorInput = {
				type: 'contractor',
				contractorType: 'performer',
				ownerUid: authState.user.uid,
				name: newPerformer.name,
				stageName: newPerformer.stageName,
				performerType: newPerformer.performerType,
				genre: newPerformer.genre || null,
				email: newPerformer.email || null,
				phone: newPerformer.phone || null,
				address: null,
				technicalRider: null,
				minPerformanceDuration: null,
				travelRequirements: null,
				agentName: null,
				agentContact: null,
				bankName: newPerformer.bankName || null,
				bankAccountNumber: newPerformer.bankAccountNumber || null,
				idDocument: newPerformer.idDocument || null,
				taxId: newPerformer.taxId || null,
				pitRate: newPerformer.pitRate ? Number(newPerformer.pitRate) : companyConfig.defaultPerformerPitRate,
				pitRatePolicy: newPerformer.pitRatePolicy || companyConfig.defaultPerformerPitRatePolicy,
				notes: null,
				createdAt: Timestamp.now(),
				updatedAt: Timestamp.now()
			};

			const validationResult = performerContractorSchema.safeParse(performerData);
			if (!validationResult.success) {
				toast.error('Validation error: ' + validationResult.error.issues[0].message);
				return;
			}

			const counterpartyId = await saveCounterparty(performerData);

			toast.success('Performer created successfully!');

			// Auto-select the newly created performer
			performerId = counterpartyId;

			// Reset form (counterparty list will auto-update via subscription)
			resetNewPerformerForm();
		} catch (err) {
			logger.error('Error creating performer:', err);
			toast.error('Failed to create performer');
		} finally {
			newPerformer.isSubmitting = false;
		}
	}

	async function handleAddPerformance() {
		if (!performanceDate) {
			toast.error('Please select a date');
			return;
		}

		if (!performerId) {
			toast.error('Please select a performer');
			return;
		}

		const performer = performerCounterparties.find((p) => p.id === performerId);
		if (!performer) {
			toast.error('Performer not found');
			return;
		}

		isSubmitting = true;
		try {
			await addPerformance(contract.id, {
				date: performanceDate,
				performerId,
				performerName: performer.stageName || performer.name,
				hoursWorked,
				setsCompleted,
				performerSharePercentage,
				performerPayVND,
				notes: notes || null,
				invoiced: false,
				invoiceMonth: null
			});

			toast.success('Performance logged successfully!');
			resetForm();
		} catch (error) {
			toast.error('Failed to add performance');
		} finally {
			isSubmitting = false;
		}
	}

	async function handleDeletePerformance(performanceId: string) {
		if (!confirm('Are you sure you want to delete this performance log?')) {
			return;
		}

		try {
			await deletePerformance(contract.id, performanceId);
			toast.success('Performance deleted');
		} catch (error) {
			toast.error('Failed to delete performance');
		}
	}

	function startEdit(performance: PerformanceLog) {
		editingId = performance.id;
		editDate = performance.date;
		editPerformerId = performance.performerId;
		editSetsCompleted = performance.setsCompleted;
		// Normalize hours from sets × hoursPerSet so stale stored values are corrected
		editHoursWorked = performance.setsCompleted * contract.performanceHoursPerSet;
		editPerformerSharePercentage = performance.performerSharePercentage ?? 60;
		editNotes = performance.notes ?? '';
		showAddForm = false; // Close add form if open
	}

	function cancelEdit() {
		editingId = null;
	}

	async function handleSaveEdit() {
		if (!editingId) return;

		const performer = performerCounterparties.find((p) => p.id === editPerformerId);
		if (!performer) {
			toast.error('Performer not found');
			return;
		}

		isEditSubmitting = true;
		try {
			await updatePerformance(contract.id, editingId, {
				date: editDate,
				performerId: editPerformerId,
				performerName: performer.stageName || performer.name,
				hoursWorked: editHoursWorked,
				setsCompleted: editSetsCompleted,
				performerSharePercentage: editPerformerSharePercentage,
				performerPayVND: editPerformerPayVND,
				notes: editNotes || null
			});
			toast.success('Performance updated');
			editingId = null;
		} catch (error) {
			toast.error('Failed to update performance');
		} finally {
			isEditSubmitting = false;
		}
	}
</script>

<div class="bg-white rounded-lg border border-gray-200 p-6">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h3 class="text-lg font-semibold text-gray-900">Performance Log</h3>
			<p class="text-sm text-gray-500 mt-1">
				{performances.length} performance{performances.length !== 1 ? 's' : ''} · {formatCurrency(totalAmount)} DJ pay
			</p>
		</div>
		<Button variant="outline" onclick={() => (showAddForm = !showAddForm)}>
			<Plus class="w-4 h-4 mr-2" />
			Log Performance
		</Button>
	</div>

	<!-- Add Performance Form -->
	{#if showAddForm}
		<div class="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
			<h4 class="font-medium text-gray-900 mb-4">New Performance</h4>
			<div class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
				<div>
					<label for="performanceDate" class="block text-sm font-medium text-gray-700 mb-1">
						Date <span class="text-red-500">*</span>
					</label>
					<input
						id="performanceDate"
						type="date"
						bind:value={performanceDate}
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					/>
				</div>
				<div>
					<label for="performerId" class="block text-sm font-medium text-gray-700 mb-1">
						Performer <span class="text-red-500">*</span>
					</label>
					<div class="flex gap-2">
						<select
							id="performerId"
							bind:value={performerId}
							class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
						>
							<option value="">Select a performer</option>
							{#each performerCounterparties as performer (performer.id)}
								<option value={performer.id}>{performer.stageName || performer.name}</option>
							{/each}
						</select>
						<button
							type="button"
							onclick={() => (showCreatePerformer = !showCreatePerformer)}
							class="px-3 py-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 whitespace-nowrap"
						>
							+ New
						</button>
					</div>
				</div>
				<div>
					<label for="hoursWorked" class="block text-sm font-medium text-gray-700 mb-1">
						Hours Worked
					</label>
					<input
						id="hoursWorked"
						type="number"
						bind:value={hoursWorked}
						min="0"
						step="0.5"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					/>
				</div>
				<div>
					<label for="setsCompleted" class="block text-sm font-medium text-gray-700 mb-1">
						Sets Completed
					</label>
					<input
						id="setsCompleted"
						type="number"
						bind:value={setsCompleted}
						onchange={() => { hoursWorked = setsCompleted * contract.performanceHoursPerSet; }}
						min="0"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					/>
				</div>
				<div>
					<label for="performerSharePercentage" class="block text-sm font-medium text-gray-700 mb-1">
						Performer Share (%)
					</label>
					<input
						id="performerSharePercentage"
						type="number"
						bind:value={performerSharePercentage}
						min="0"
						max="100"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					/>
				</div>
				<div class="flex flex-col justify-end pb-0.5">
					<p class="text-sm text-gray-500">Performer pay</p>
					<p class="font-medium text-gray-700">{formatCurrency(performerPayVND)}</p>
				</div>
				<div class="md:col-span-2 lg:col-span-3">
					<label for="notes" class="block text-sm font-medium text-gray-700 mb-1">
						Notes
					</label>
					<input
						id="notes"
						type="text"
						bind:value={notes}
						placeholder="Optional notes..."
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
					/>
				</div>
			</div>
			<div class="flex gap-2 mt-4">
				<Button variant="dark" onclick={handleAddPerformance} disabled={isSubmitting}>
					{isSubmitting ? 'Saving...' : 'Add Performance'}
				</Button>
				<Button variant="outline" onclick={resetForm}>Cancel</Button>
			</div>
		</div>
	{/if}

	<!-- Inline Performer Creation -->
	{#if showCreatePerformer}
		<div class="mb-6">
			<CreatePerformerInline
				formState={newPerformer}
				onCancel={resetNewPerformerForm}
				onCreate={handleCreatePerformer}
			/>
		</div>
	{/if}

	<!-- Performance List -->
	{#if isLoading}
		<div class="text-center py-8 text-gray-500">Loading performances...</div>
	{:else if performances.length === 0}
		<div class="text-center py-8 text-gray-500">
			No performances logged yet. Click "Log Performance" to add one.
		</div>
	{:else}
		<div class="space-y-3">
			{#each performances as performance (performance.id)}
				{#if editingId === performance.id}
					<!-- Inline edit form -->
					<div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
						<h4 class="font-medium text-gray-900 mb-4">Edit Performance</h4>
						<div class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
							<div>
								<label for="editDate-{performance.id}" class="block text-sm font-medium text-gray-700 mb-1">Date</label>
								<input
									id="editDate-{performance.id}"
									type="date"
									bind:value={editDate}
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
								/>
							</div>
							<div>
								<label for="editPerformerId-{performance.id}" class="block text-sm font-medium text-gray-700 mb-1">Performer</label>
								<select
									id="editPerformerId-{performance.id}"
									bind:value={editPerformerId}
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
								>
									{#each performerCounterparties as p (p.id)}
										<option value={p.id}>{p.stageName || p.name}</option>
									{/each}
								</select>
							</div>
							<div>
								<label for="editHours-{performance.id}" class="block text-sm font-medium text-gray-700 mb-1">Hours Worked</label>
								<input
									id="editHours-{performance.id}"
									type="number"
									bind:value={editHoursWorked}
									min="0"
									step="0.5"
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
								/>
							</div>
							<div>
								<label for="editSets-{performance.id}" class="block text-sm font-medium text-gray-700 mb-1">Sets Completed</label>
								<input
									id="editSets-{performance.id}"
									type="number"
									bind:value={editSetsCompleted}
									onchange={() => { editHoursWorked = editSetsCompleted * contract.performanceHoursPerSet; }}
									min="0"
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
								/>
							</div>
							<div>
								<label for="editShare-{performance.id}" class="block text-sm font-medium text-gray-700 mb-1">Performer Share (%)</label>
								<input
									id="editShare-{performance.id}"
									type="number"
									bind:value={editPerformerSharePercentage}
									min="0"
									max="100"
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
								/>
							</div>
							<div class="flex flex-col justify-end pb-0.5">
								<p class="text-sm text-gray-500">Performer pay</p>
								<p class="font-medium text-gray-700">{formatCurrency(editPerformerPayVND)}</p>
							</div>
							<div class="md:col-span-2 lg:col-span-3">
								<label for="editNotes-{performance.id}" class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
								<input
									id="editNotes-{performance.id}"
									type="text"
									bind:value={editNotes}
									placeholder="Optional notes..."
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
								/>
							</div>
						</div>
						<div class="flex gap-2 mt-4">
							<Button variant="dark" onclick={handleSaveEdit} disabled={isEditSubmitting}>
								{isEditSubmitting ? 'Saving...' : 'Save Changes'}
							</Button>
							<Button variant="outline" onclick={cancelEdit}>Cancel</Button>
						</div>
					</div>
				{:else}
					<div
						class="flex items-center justify-between p-4 rounded-lg border {performance.invoiced
							? 'bg-gray-50 border-gray-200'
							: 'bg-white border-gray-200'}"
					>
						<div class="flex items-center gap-4">
							<div class="flex items-center gap-2 text-gray-600">
								<Calendar class="w-4 h-4" />
								<span class="font-medium">{formatDateString(performance.date)}</span>
							</div>
							<div class="flex items-center gap-2 text-gray-600">
								<User class="w-4 h-4" />
								<span>{performance.performerName}</span>
							</div>
							<div class="flex items-center gap-2 text-gray-600">
								<Clock class="w-4 h-4" />
								<span>{performance.hoursWorked}h / {performance.setsCompleted} sets</span>
							</div>
							{#if performance.notes}
								<span class="text-sm text-gray-500 italic">{performance.notes}</span>
							{/if}
						</div>
						<div class="flex items-center gap-3">
							<div class="text-right">
								<p class="font-medium text-emerald-600">
									{formatCurrency(performance.performerPayVND ?? 0)}
								</p>
							</div>
							<Button
								variant="ghost"
								size="sm"
								onclick={() => startEdit(performance)}
								class="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
							>
								<Pencil class="w-4 h-4" />
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onclick={() => handleDeletePerformance(performance.id)}
								class="text-red-500 hover:text-red-700 hover:bg-red-50"
							>
								<Trash2 class="w-4 h-4" />
							</Button>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</div>
