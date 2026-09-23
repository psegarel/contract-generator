<script lang="ts">
	import type { PerformerContractor } from '$lib/types/v2';
	import type { PerformanceFormData } from '$lib/utils/v2/djResidencyContracts';
	import { Button } from '$lib/components/ui/button';
	import TextField from '$lib/components/TextField.svelte';
	import SelectField from '$lib/components/SelectField.svelte';
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

<div class="{isAdd ? 'bg-muted' : 'bg-primary/5'} rounded-sm p-4 {isAdd ? 'mb-6' : ''}">
	<h4 class="font-medium text-foreground mb-4">{isAdd ? 'New Performance' : 'Edit Performance'}</h4>
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
		<TextField
			id="{prefix}performanceDate"
			label="Date"
			type="date"
			bind:value={date}
			required={isAdd}
		/>
		<div>
			<SelectField
				id="{prefix}performerId"
				label="Performer"
				bind:value={performerId}
				onchange={handlePerformerChange}
				required={isAdd}
			>
				{#if isAdd}
					<option value="">Select a performer</option>
					<option value="__new__">+ New Performer</option>
				{/if}
				{#each performerCounterparties as performer (performer.id)}
					<option value={performer.id}>{performer.stageName || performer.name}</option>
				{/each}
			</SelectField>
		</div>
		<TextField
			id="{prefix}hoursWorked"
			label="Actual Hours Worked"
			type="number"
			bind:value={hoursWorked}
			min="0.25"
			step="0.5"
			required={isAdd}
		/>
		<TextField
			id="{prefix}performerSharePercentage"
			label="Performer Share (%)"
			type="number"
			bind:value={performerSharePercentage}
			min="0"
			max="100"
		/>
		<div class="flex flex-col justify-end pb-0.5">
			<p class="text-sm text-muted-foreground">Performer pay</p>
			<p class="font-medium text-foreground">{formatCurrency(performerPayVND)}</p>
		</div>
		<div class="md:col-span-2 lg:col-span-3">
			<TextField
				id="{prefix}notes"
				label="Notes"
				bind:value={notes}
				placeholder="Optional notes..."
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
