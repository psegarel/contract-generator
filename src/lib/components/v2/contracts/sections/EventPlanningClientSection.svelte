<script lang="ts">
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

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Client Information</h3>
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<div class="col-span-full">
			<label for="clientCompany" class="block text-sm font-medium text-gray-700 mb-1">
				Company Name <span class="text-red-500">*</span>
			</label>
			<input
				id="clientCompany"
				type="text"
				value={clientCompany}
				oninput={(e) => onclientCompanyChange(e.currentTarget.value)}
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="ABC Corporation Ltd"
			/>
		</div>

		<div class="col-span-full">
			<label for="clientAddress" class="block text-sm font-medium text-gray-700 mb-1">
				Address <span class="text-red-500">*</span>
			</label>
			<input
				id="clientAddress"
				type="text"
				value={clientAddress}
				oninput={(e) => onclientAddressChange(e.currentTarget.value)}
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="123 Main St, Ho Chi Minh City"
			/>
		</div>

		<div>
			<label for="clientTaxCode" class="block text-sm font-medium text-gray-700 mb-1">
				Tax Code <span class="text-red-500">*</span>
			</label>
			<input
				id="clientTaxCode"
				type="text"
				value={clientTaxCode}
				oninput={(e) => onclientTaxCodeChange(e.currentTarget.value)}
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="Tax identification number"
			/>
		</div>

		<div>
			<label for="clientRepresentativeName" class="block text-sm font-medium text-gray-700 mb-1">
				Representative Name <span class="text-red-500">*</span>
			</label>
			<input
				id="clientRepresentativeName"
				type="text"
				value={clientRepresentativeName}
				oninput={(e) => onclientRepresentativeNameChange(e.currentTarget.value)}
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="John Doe"
			/>
		</div>

		<div class="col-span-full">
			<label for="clientRepresentativePosition" class="block text-sm font-medium text-gray-700 mb-1">
				Representative Position <span class="text-red-500">*</span>
			</label>
			<input
				id="clientRepresentativePosition"
				type="text"
				value={clientRepresentativePosition}
				oninput={(e) => onclientRepresentativePositionChange(e.currentTarget.value)}
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="CEO, Director, etc."
			/>
		</div>
	</div>
</div>
