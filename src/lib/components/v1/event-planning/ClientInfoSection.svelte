<!--
	@deprecated This component is part of the v1 system and is being phased out.
	Use components from $lib/components/v2/contracts/sections/ instead for new development.
	This component is only kept for backward compatibility with existing v1 event planning contracts.
-->
<script lang="ts">
	import { clientInfoSchema, type ClientInfo } from '$lib/schemas/eventPlanningContract';
	import { validateWithSchema } from '$lib/utils/eventPlanningFormHelpers';
	import TextField from '$lib/components/TextField.svelte';
	import TextareaField from '$lib/components/TextareaField.svelte';

	let {
		data,
		onChange
	}: {
		data: ClientInfo;
		onChange: (data: ClientInfo, errors: Record<string, string>) => void;
	} = $props();

	let errors = $state<Record<string, string>>({});
	let touched = $state<Record<string, boolean>>({});

	function handleChange(field: keyof ClientInfo, value: string) {
		touched = { ...touched, [field]: true };
		const newData = { ...data, [field]: value };
		const validation = validateWithSchema(clientInfoSchema, newData, touched);
		errors = validation.displayErrors;
		onChange(newData, validation.allErrors);
	}
</script>

<div class="space-y-6">
	<h3 class="text-xl font-bold text-foreground">Client Information (Party A)</h3>

	<div class="grid gap-6 grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
		<TextField
			id="clientCompany"
			label="Company Name"
			value={data.clientCompany}
			required={true}
			placeholder="e.g., ABC Corporation"
			error={errors.clientCompany}
			onInput={(value) => handleChange('clientCompany', value)}
		/>

		<TextField
			id="clientTaxCode"
			label="Tax Code"
			value={data.clientTaxCode}
			required={true}
			placeholder="e.g., 0123456789"
			error={errors.clientTaxCode}
			onInput={(value) => handleChange('clientTaxCode', value)}
		/>

		<div class="col-span-full">
			<TextareaField
				id="clientAddress"
				label="Company Address"
				value={data.clientAddress}
				required={true}
				rows={2}
				placeholder="Full company address"
				error={errors.clientAddress}
				onInput={(value) => handleChange('clientAddress', value)}
			/>
		</div>

		<TextField
			id="clientRepresentativeName"
			label="Representative Name"
			value={data.clientRepresentativeName}
			required={true}
			placeholder="Full name of authorized representative"
			error={errors.clientRepresentativeName}
			onInput={(value) => handleChange('clientRepresentativeName', value)}
		/>

		<TextField
			id="clientRepresentativePosition"
			label="Representative Position"
			value={data.clientRepresentativePosition}
			required={true}
			placeholder="e.g., CEO, Director, Manager"
			error={errors.clientRepresentativePosition}
			onInput={(value) => handleChange('clientRepresentativePosition', value)}
		/>
	</div>
</div>
