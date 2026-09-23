<script lang="ts">
	import type { DjResidencyContract, PerformanceLog } from '$lib/types/v2';
	import {
		subscribeToPerformances,
		addPerformanceAndSync,
		updatePerformanceAndSync,
		deletePerformanceAndSync,
		syncContractValue
	} from '$lib/utils/v2/djResidencyContracts';
	import type { PerformanceFormData } from '$lib/utils/v2/djResidencyContracts';
	import { counterpartyState } from '$lib/state/v2';
	import { Button } from '$lib/components/ui/button';
	import { Plus } from '@lucide/svelte';
	import { formatCurrency } from '$lib/utils/formatting';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import type { Unsubscribe } from 'firebase/firestore';
	import { logger } from '$lib/utils/logger';
	import CreatePerformerInline from './sections/CreatePerformerInline.svelte';
	import PerformanceForm from './sections/PerformanceForm.svelte';
	import PerformanceList from './sections/PerformanceList.svelte';

	interface Props {
		contract: DjResidencyContract;
	}

	let { contract }: Props = $props();

	// Subscription state
	let performances = $state<PerformanceLog[]>([]);
	let isLoading = $state(true);
	let unsubscribe: Unsubscribe | null = null;

	// UI state
	let showAddForm = $state(false);
	let isSubmitting = $state(false);
	let showCreatePerformer = $state(false);
	let addFormPerformerId = $state('');
	let editingId = $state<string | null>(null);
	let isEditSubmitting = $state(false);

	let performerCounterparties = $derived(counterpartyState.performers);

	let totalAmount = $derived(performances.reduce((sum, p) => sum + (p.performerPayVND ?? 0), 0));

	onMount(() => {
		counterpartyState.init();

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

		syncContractValue(contract.id, contract.performanceFeeVND).catch((err) => {
			logger.error('Failed to sync contract value on mount:', err);
		});

		return () => {
			unsubscribe?.();
			counterpartyState.destroy();
		};
	});

	// --- Add performance ---

	async function handleAddPerformance(data: PerformanceFormData) {
		isSubmitting = true;
		try {
			await addPerformanceAndSync(
				contract.id,
				contract.performanceFeeVND,
				data,
				performerCounterparties
			);
			toast.success('Performance logged successfully!');
			showAddForm = false;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to add performance');
		} finally {
			isSubmitting = false;
		}
	}

	// --- Edit performance ---

	function startEdit(performance: PerformanceLog) {
		editingId = performance.id;
		showAddForm = false;
	}

	function cancelEdit() {
		editingId = null;
	}

	async function handleSaveEdit(data: PerformanceFormData) {
		if (!editingId) return;

		isEditSubmitting = true;
		try {
			await updatePerformanceAndSync(
				contract.id,
				editingId,
				contract.performanceFeeVND,
				data,
				performerCounterparties
			);
			toast.success('Performance updated');
			editingId = null;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to update performance');
		} finally {
			isEditSubmitting = false;
		}
	}

	// --- Delete performance ---

	async function handleDeletePerformance(performanceId: string) {
		if (!confirm('Are you sure you want to delete this performance log?')) return;

		try {
			await deletePerformanceAndSync(contract.id, performanceId, contract.performanceFeeVND);
			toast.success('Performance deleted');
		} catch (error) {
			toast.error('Failed to delete performance');
		}
	}

	// --- Inline performer creation ---

	function handlePerformerCreated(counterpartyId: string) {
		addFormPerformerId = counterpartyId;
		showCreatePerformer = false;
	}
</script>

<div class="bg-card p-6">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h3 class="text-lg font-semibold text-foreground">Performance Log</h3>
			<p class="text-sm text-muted-foreground mt-1">
				{performances.length} performance{performances.length !== 1 ? 's' : ''} · {formatCurrency(
					totalAmount
				)} DJ pay
			</p>
		</div>
		<Button variant="outline" onclick={() => (showAddForm = !showAddForm)}>
			<Plus class="w-4 h-4 mr-2" />
			Log Performance
		</Button>
	</div>

	{#if showAddForm}
		<div class="mb-6">
			<PerformanceForm
				mode="add"
				performanceFeeVND={contract.performanceFeeVND}
				{performerCounterparties}
				initialValues={{
					date: '',
					performerId: addFormPerformerId,
					hoursWorked: contract.performanceHoursPerSet,
					performerSharePercentage: 60,
					notes: ''
				}}
				{isSubmitting}
				onSubmit={handleAddPerformance}
				onCancel={() => (showAddForm = false)}
				onCreatePerformer={() => (showCreatePerformer = true)}
			/>
		</div>
	{/if}

	{#if showCreatePerformer}
		<div class="mb-6">
			<CreatePerformerInline
				onCreated={handlePerformerCreated}
				onCancel={() => (showCreatePerformer = false)}
			/>
		</div>
	{/if}

	<PerformanceList
		{performances}
		{isLoading}
		{editingId}
		{contract}
		{performerCounterparties}
		onStartEdit={startEdit}
		onSaveEdit={handleSaveEdit}
		onCancelEdit={cancelEdit}
		{isEditSubmitting}
		onDelete={handleDeletePerformance}
	/>
</div>
