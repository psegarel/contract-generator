<script lang="ts">
	interface Props {
		clientEmail: string;
		clientAddress: string;
		clientPhone: string;
		clientIdDocument: string;
		clientTaxId: string;
		onclientEmailChange: (value: string) => void;
		onclientAddressChange: (value: string) => void;
		onclientPhoneChange: (value: string) => void;
		onclientIdDocumentChange: (value: string) => void;
		onclientTaxIdChange: (value: string) => void;
	}

	let {
		clientEmail,
		clientAddress,
		clientPhone,
		clientIdDocument,
		clientTaxId,
		onclientEmailChange,
		onclientAddressChange,
		onclientPhoneChange,
		onclientIdDocumentChange,
		onclientTaxIdChange
	}: Props = $props();
</script>

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Client Information (for PDF)</h3>
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<div>
			<label for="clientEmail" class="block text-sm font-medium text-gray-700 mb-1">
				Client Email <span class="text-red-500">*</span>
			</label>
			<input
				id="clientEmail"
				type="email"
				value={clientEmail}
				oninput={(e) => onclientEmailChange(e.currentTarget.value)}
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="client@example.com"
			/>
		</div>

		<div>
			<label for="clientPhone" class="block text-sm font-medium text-gray-700 mb-1">
				Client Phone <span class="text-red-500">*</span>
			</label>
			<input
				id="clientPhone"
				type="tel"
				value={clientPhone}
				oninput={(e) => onclientPhoneChange(e.currentTarget.value)}
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="+84 123 456 789"
			/>
		</div>

		<div class="col-span-full">
			<label for="clientAddress" class="block text-sm font-medium text-gray-700 mb-1">
				Client Address <span class="text-red-500">*</span>
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
			<label for="clientIdDocument" class="block text-sm font-medium text-gray-700 mb-1">
				Client ID Document <span class="text-red-500">*</span>
			</label>
			<input
				id="clientIdDocument"
				type="text"
				value={clientIdDocument}
				oninput={(e) => onclientIdDocumentChange(e.currentTarget.value)}
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="ID or Passport number"
			/>
		</div>

		<div>
			<label for="clientTaxId" class="block text-sm font-medium text-gray-700 mb-1">
				Client Tax ID
			</label>
			<input
				id="clientTaxId"
				type="text"
				value={clientTaxId}
				oninput={(e) => onclientTaxIdChange(e.currentTarget.value)}
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="Tax identification number"
			/>
		</div>
	</div>
</div>
