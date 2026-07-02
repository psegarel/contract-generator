<script lang="ts">
	import type { PerformanceLog, DjResidencyContract, PerformerContractor } from '$lib/types/v2';
	import type { PerformanceFormData } from '$lib/utils/v2/djResidencyContracts';
	import PerformanceForm from './PerformanceForm.svelte';
	import PerformanceItem from './PerformanceItem.svelte';

	interface Props {
		performances: PerformanceLog[];
		isLoading: boolean;
		editingId: string | null;
		contract: DjResidencyContract;
		performerCounterparties: PerformerContractor[];
		onStartEdit: (performance: PerformanceLog) => void;
		onSaveEdit: (data: PerformanceFormData) => void;
		onCancelEdit: () => void;
		isEditSubmitting: boolean;
		onDelete: (id: string) => void;
	}

	let {
		performances,
		isLoading,
		editingId,
		contract,
		performerCounterparties,
		onStartEdit,
		onSaveEdit,
		onCancelEdit,
		isEditSubmitting,
		onDelete
	}: Props = $props();

	function getEditingPerformance(): PerformanceLog | undefined {
		return performances.find((p) => p.id === editingId);
	}
</script>

{#if isLoading}
	<p class="text-gray-500 text-sm">Loading performances...</p>
{:else if performances.length === 0}
	<div class="text-center py-8 text-gray-500">
		<p>No performances logged yet</p>
	</div>
{:else}
	<div class="space-y-3">
		{#each performances as performance (performance.id)}
			{#if editingId === performance.id}
				{@const editing = getEditingPerformance()}
				{#if editing}
					<PerformanceForm
						mode="edit"
						performanceFeeVND={contract.performanceFeeVND}
						{performerCounterparties}
						initialValues={{
							date: editing.date,
							performerId: editing.performerId,
							hoursWorked: editing.hoursWorked,
							performerSharePercentage: editing.performerSharePercentage ?? 60,
							notes: editing.notes ?? ''
						}}
						isSubmitting={isEditSubmitting}
						onSubmit={onSaveEdit}
						onCancel={onCancelEdit}
						idSuffix="edit-{performance.id}"
					/>
				{/if}
			{:else}
				<PerformanceItem
					{performance}
					onEdit={() => onStartEdit(performance)}
					onDelete={() => onDelete(performance.id)}
				/>
			{/if}
		{/each}
	</div>
{/if}
