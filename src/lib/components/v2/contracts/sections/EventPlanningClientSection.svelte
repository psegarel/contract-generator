<script lang="ts">
	import FormSection from '$lib/components/FormSection.svelte';
	import TextField from '$lib/components/TextField.svelte';

	interface Props {
		clientCompany: string;
		clientAddress: string;
		clientTaxCode: string;
		clientRepresentativeName: string;
		clientRepresentativePosition: string;
		onclientCompanyChange: (value: string) => void;
		onclientAddressChange: (value: string) => void;
		onclientTaxCodeChange: (value: string) => void;
		onclientRepresentativeNameChange: (value: string) => void;
		onclientRepresentativePositionChange: (value: string) => void;
	}

	let {
		clientCompany,
		clientAddress,
		clientTaxCode,
		clientRepresentativeName,
		clientRepresentativePosition,
		onclientCompanyChange,
		onclientAddressChange,
		onclientTaxCodeChange,
		onclientRepresentativeNameChange,
		onclientRepresentativePositionChange
	}: Props = $props();
</script>

<FormSection title="Client Information">
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<TextField
			class="col-span-full"
			id="clientCompany"
			label="Company Name"
			value={clientCompany}
			oninput={(e) => onclientCompanyChange(e.currentTarget.value)}
			required
			placeholder="ABC Corporation Ltd"
		/>

		<TextField
			class="col-span-full"
			id="clientAddress"
			label="Address"
			value={clientAddress}
			oninput={(e) => onclientAddressChange(e.currentTarget.value)}
			required
			placeholder="123 Main St, Ho Chi Minh City"
		/>

		<TextField
			id="clientTaxCode"
			label="Tax Code"
			value={clientTaxCode}
			oninput={(e) => onclientTaxCodeChange(e.currentTarget.value)}
			required
			placeholder="Tax identification number"
		/>

		<TextField
			id="clientRepresentativeName"
			label="Representative Name"
			value={clientRepresentativeName}
			oninput={(e) => onclientRepresentativeNameChange(e.currentTarget.value)}
			required
			placeholder="John Doe"
		/>

		<TextField
			class="col-span-full"
			id="clientRepresentativePosition"
			label="Representative Position"
			value={clientRepresentativePosition}
			oninput={(e) => onclientRepresentativePositionChange(e.currentTarget.value)}
			required
			placeholder="CEO, Director, etc."
		/>
	</div>
</FormSection>
