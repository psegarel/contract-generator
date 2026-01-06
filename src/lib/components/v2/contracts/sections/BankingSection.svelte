<script lang="ts">
	interface Props {
		bankName: string;
		accountNumber: string;
		onbankNameChange: (value: string) => void;
		onaccountNumberChange: (value: string) => void;
	}

	let { bankName, accountNumber, onbankNameChange, onaccountNumberChange }: Props = $props();
</script>

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Banking Information</h3>
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<div>
			<label for="bankName" class="block text-sm font-medium text-gray-700 mb-1">
				Bank Name <span class="text-red-500">*</span>
			</label>
			<input
				id="bankName"
				type="text"
				value={bankName}
				oninput={(e) => onbankNameChange(e.currentTarget.value)}
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="Vietcombank, Techcombank, etc."
			/>
		</div>

		<div>
			<label for="accountNumber" class="block text-sm font-medium text-gray-700 mb-1">
				Account Number <span class="text-red-500">*</span>
			</label>
			<input
				id="accountNumber"
				type="text"
				value={accountNumber}
				oninput={(e) => onaccountNumberChange(e.currentTarget.value)}
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="1234567890"
			/>
		</div>
	</div>
</div>
