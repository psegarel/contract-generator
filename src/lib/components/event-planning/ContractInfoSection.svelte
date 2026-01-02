<script lang="ts">
	import { contractInfoSchema, type ContractInfo } from '$lib/schemas/eventPlanningContract';
	import { validateWithSchema } from '$lib/utils/eventPlanningFormHelpers';
	import TextField from '$lib/components/TextField.svelte';

	let {
		data,
		onChange
	}: {
		data: ContractInfo;
		onChange: (data: ContractInfo, errors: Record<string, string>) => void;
	} = $props();

	let errors = $state<Record<string, string>>({});
	let touched = $state<Record<string, boolean>>({});

	function handleChange(field: keyof ContractInfo, value: string) {
		touched = { ...touched, [field]: true };
		const newData = { ...data, [field]: value };
		const validation = validateWithSchema(contractInfoSchema, newData, touched);
		errors = validation.displayErrors;
		onChange(newData, validation.allErrors);
	}
</script>

<div class="space-y-6">
	<h3 class="text-xl font-bold text-foreground">Contract Information</h3>

	<div class="grid gap-6 grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
		<TextField
			id="contractDate"
			label="Contract Date"
			type="date"
			value={data.contractDate}
			required={true}
			error={errors.contractDate}
			onInput={(value) => handleChange('contractDate', value)}
		/>

		<TextField
			id="contractLocation"
			label="City/Location"
			value={data.contractLocation}
			required={true}
			placeholder="e.g., Danang, Vietnam"
			helperText="Where the contract is being signed"
			error={errors.contractLocation}
			onInput={(value) => handleChange('contractLocation', value)}
		/>
	</div>
</div>
