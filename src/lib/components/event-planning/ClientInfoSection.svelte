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

<div class="p-6 bg-white rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-6">Client Information (Party A)</h3>

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

		<TextField
			id="clientNationality"
			label="Nationality"
			value={data.clientNationality}
			required={true}
			placeholder="e.g., Vietnamese, American"
			error={errors.clientNationality}
			onInput={(value) => handleChange('clientNationality', value)}
		/>

		<TextField
			id="clientPassportNumber"
			label="Passport Number"
			value={data.clientPassportNumber}
			required={true}
			placeholder="Passport or ID number"
			error={errors.clientPassportNumber}
			onInput={(value) => handleChange('clientPassportNumber', value)}
		/>

		<TextField
			id="clientPassportIssuedDate"
			label="Passport Issued Date"
			type="date"
			value={data.clientPassportIssuedDate}
			required={true}
			error={errors.clientPassportIssuedDate}
			onInput={(value) => handleChange('clientPassportIssuedDate', value)}
		/>

		<TextField
			id="clientPassportIssuedPlace"
			label="Passport Issued Place"
			value={data.clientPassportIssuedPlace}
			required={true}
			placeholder="e.g., Hanoi, Vietnam"
			error={errors.clientPassportIssuedPlace}
			onInput={(value) => handleChange('clientPassportIssuedPlace', value)}
		/>

		<div class="col-span-full">
			<TextareaField
				id="clientAuthority"
				label="Authority Basis"
				value={data.clientAuthority}
				required={true}
				rows={2}
				placeholder="Legal basis for representative's authority (e.g., company charter, board resolution)"
				helperText="Document or legal basis granting representative authority"
				error={errors.clientAuthority}
				onInput={(value) => handleChange('clientAuthority', value)}
			/>
		</div>
	</div>
</div>
