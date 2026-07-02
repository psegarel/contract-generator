<script lang="ts">
	import type { PerformerContractor } from '$lib/types/v2';
	import type { PerformanceFormData } from '$lib/utils/v2/djResidencyContracts';
	import { Button } from '$lib/components/ui/button';
	import { formatCurrency } from '$lib/utils/formatting';
	import { onMount } from 'svelte';

	export interface PerformanceFormValues {
		date: string;
		performerId: string;
		hoursWorked: number;
		performerSharePercentage: number;
		notes: string;
	}

	interface Props {
		mode: 'add' | 'edit';
		performanceFeeVND: number;
		performerCounterparties: PerformerContractor[];
		initialValues?: PerformanceFormValues;
		isSubmitting: boolean;
		onSubmit: (data: PerformanceFormData) => void;
		onCancel: () => void;
		onCreatePerformer?: () => void;
		idSuffix?: string;
	}

	let {
		mode,
		performanceFeeVND,
		performerCounterparties,
		initialValues,
		isSubmitting,
		onSubmit,
		onCancel,
		onCreatePerformer,
		idSuffix = ''
	}: Props = $props();

	let date = $state('');
	let performerId = $state('');
	let hoursWorked = $state(0);
	let performerSharePercentage = $state(60);
	let notes = $state('');

	onMount(() => {
		if (initialValues) {
			date = initialValues.date;
			performerId = initialValues.performerId;
			hoursWorked = initialValues.hoursWorked;
			performerSharePercentage = initialValues.performerSharePercentage;
			notes = initialValues.notes;
		}
	});

	let performerPayVND = $derived(
		Math.round(hoursWorked * performanceFeeVND * (performerSharePercentage / 100))
	);

	const isAdd = $derived(mode === 'add');
	const prefix = $derived(idSuffix ? `${idSuffix}-` : '');

	function handleSubmit() {
		onSubmit({ date, performerId, hoursWorked, performerSharePercentage, notes, performerPayVND });
	}

	function handlePerformerChange() {
		if (performerId === '__new__' && onCreatePerformer) {
			performerId = '';
			onCreatePerformer();
		}
	}
</script>

<div class="{isAdd ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'} rounded-lg p-4 border {isAdd ? 'mb-6' : ''}">
	<h4 class="font-medium text-gray-900 mb-4">{isAdd ? 'New Performance' : 'Edit Performance'}</h4>
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
		<div>
			<label for="{prefix}performanceDate" class="block text-sm font-medium text-gray-700 mb-1">
				Date {#if isAdd}<span class="text-red-500">*</span>{/if}
			</label>
			<input
				id="{prefix}performanceDate"
				type="date"
				bind:value={date}
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			/>
		</div>
		<div>
			<label for="{prefix}performerId" class="block text-sm font-medium text-gray-700 mb-1">
				Performer {#if isAdd}<span class="text-red-500">*</span>{/if}
			</label>
			<select
				id="{prefix}performerId"
				bind:value={performerId}
				onchange={handlePerformerChange}
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			>
				{#if isAdd}
					<option value="">Select a performer</option>
					<option value="__new__">+ New Performer</option>
				{/if}
				{#each performerCounterparties as performer (performer.id)}
					<option value={performer.id}>{performer.stageName || performer.name}</option>
				{/each}
			</select>
		</div>
		<div>
			<label for="{prefix}hoursWorked" class="block text-sm font-medium text-gray-700 mb-1">
				Hours Worked
			</label>
			<input
				id="{prefix}hoursWorked"
				type="number"
				bind:value={hoursWorked}
				min="0"
				step="0.5"
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			/>
		</div>
		<div>
			<label for="{prefix}performerSharePercentage" class="block text-sm font-medium text-gray-700 mb-1">
				Performer Share (%)
			</label>
			<input
				id="{prefix}performerSharePercentage"
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
			<label for="{prefix}notes" class="block text-sm font-medium text-gray-700 mb-1">
				Notes
			</label>
			<input
				id="{prefix}notes"
				type="text"
				bind:value={notes}
				placeholder="Optional notes..."
				class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			/>
		</div>
	</div>
	<div class="flex gap-2 mt-4">
		<Button variant="dark" onclick={handleSubmit} disabled={isSubmitting}>
			{isSubmitting ? 'Saving...' : isAdd ? 'Add Performance' : 'Save Changes'}
		</Button>
		<Button variant="outline" onclick={onCancel}>Cancel</Button>
	</div>
</div>
