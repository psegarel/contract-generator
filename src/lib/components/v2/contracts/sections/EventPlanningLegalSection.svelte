<script lang="ts">
	interface Props {
		paymentGracePeriodDays: number;
		terminationNoticeDays: number;
		negotiationPeriodDays: number;
		arbitrationLocation: string;
		arbitrationLanguage: string;
		onpaymentGracePeriodDaysChange: (value: number) => void;
		onterminationNoticeDaysChange: (value: number) => void;
		onnegotiationPeriodDaysChange: (value: number) => void;
		onarbitrationLocationChange: (value: string) => void;
		onarbitrationLanguageChange: (value: string) => void;
	}

	let {
		paymentGracePeriodDays,
		terminationNoticeDays,
		negotiationPeriodDays,
		arbitrationLocation,
		arbitrationLanguage,
		onpaymentGracePeriodDaysChange,
		onterminationNoticeDaysChange,
		onnegotiationPeriodDaysChange,
		onarbitrationLocationChange,
		onarbitrationLanguageChange
	}: Props = $props();
</script>

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Legal Terms</h3>
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<div>
			<label for="paymentGracePeriodDays" class="block text-sm font-medium text-gray-700 mb-1">
				Payment Grace Period (days) <span class="text-red-500">*</span>
			</label>
			<input
				id="paymentGracePeriodDays"
				type="number"
				value={paymentGracePeriodDays}
				oninput={(e) => onpaymentGracePeriodDaysChange(Number(e.currentTarget.value))}
				min="1"
				step="1"
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="30"
			/>
		</div>

		<div>
			<label for="terminationNoticeDays" class="block text-sm font-medium text-gray-700 mb-1">
				Termination Notice Period (days) <span class="text-red-500">*</span>
			</label>
			<input
				id="terminationNoticeDays"
				type="number"
				value={terminationNoticeDays}
				oninput={(e) => onterminationNoticeDaysChange(Number(e.currentTarget.value))}
				min="1"
				step="1"
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="7"
			/>
		</div>

		<div>
			<label for="negotiationPeriodDays" class="block text-sm font-medium text-gray-700 mb-1">
				Negotiation Period (days) <span class="text-red-500">*</span>
			</label>
			<input
				id="negotiationPeriodDays"
				type="number"
				value={negotiationPeriodDays}
				oninput={(e) => onnegotiationPeriodDaysChange(Number(e.currentTarget.value))}
				min="1"
				step="1"
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="14"
			/>
		</div>

		<div>
			<label for="arbitrationLocation" class="block text-sm font-medium text-gray-700 mb-1">
				Arbitration Location <span class="text-red-500">*</span>
			</label>
			<input
				id="arbitrationLocation"
				type="text"
				value={arbitrationLocation}
				oninput={(e) => onarbitrationLocationChange(e.currentTarget.value)}
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="Ho Chi Minh City"
			/>
		</div>

		<div class="col-span-full">
			<label for="arbitrationLanguage" class="block text-sm font-medium text-gray-700 mb-1">
				Arbitration Language <span class="text-red-500">*</span>
			</label>
			<input
				id="arbitrationLanguage"
				type="text"
				value={arbitrationLanguage}
				oninput={(e) => onarbitrationLanguageChange(e.currentTarget.value)}
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="Vietnamese, English"
			/>
		</div>
	</div>
</div>
