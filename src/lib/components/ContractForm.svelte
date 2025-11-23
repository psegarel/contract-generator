<script lang="ts">
	import { contractSchema, type ContractData } from '$lib/schemas/contract';
	import { generateContract } from '$lib/utils/generator';
	import { companyConfig } from '$lib/config/company';
	import { Loader2 } from 'lucide-svelte';

	let formData: ContractData = $state({
		clientName: '',
		clientAddress: '',
		clientPhone: '',
		clientTaxId: '',
		jobName: '',
		eventName: '',
		numberOfPerformances: 1,
		eventLocation: '',
		firstPerformanceTime: '',
		jobContent: '',
		bankName: '',
		accountNumber: '',
		netFee: 0,
		taxRate: 10, // Default 10%
		startDate: '',
		endDate: ''
	});

	let errors: Partial<Record<keyof ContractData, string>> = $state({});
	let isGenerating = $state(false);

	// Derived values for display
	let grossFee = $derived(formData.netFee && formData.taxRate ? Math.round(formData.netFee / (1 - formData.taxRate / 100)) : 0);
	let taxAmount = $derived(grossFee - formData.netFee);

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
	};

	const validate = () => {
		const result = contractSchema.safeParse(formData);
		if (!result.success) {
			const fieldErrors = result.error.flatten().fieldErrors;
			errors = Object.fromEntries(
				Object.entries(fieldErrors).map(([key, val]) => [key, val?.[0] || ''])
			) as Partial<Record<keyof ContractData, string>>;
			return false;
		}
		errors = {};
		return true;
	};

	const handleSubmit = async () => {
		if (!validate()) return;

		isGenerating = true;
		try {
			const blob = await generateContract(formData);
			const filename = `Contract_${formData.clientName.replace(/\s+/g, '_')}.docx`;

			// Try File System Access API (Chrome, Edge, Opera)
			if ('showSaveFilePicker' in window) {
				try {
					// @ts-ignore - showSaveFilePicker is not yet in standard TS lib
					const handle = await window.showSaveFilePicker({
						suggestedName: filename,
						types: [
							{
								description: 'Word Document',
								accept: {
									'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
								}
							}
						]
					});
					const writable = await handle.createWritable();
					await writable.write(blob);
					await writable.close();
					return;
				} catch (err: any) {
					// User cancelled or API failed, fall back if not cancelled
					if (err.name !== 'AbortError') {
						console.error('File Picker Error:', err);
					} else {
						return; // User cancelled, don't fallback
					}
				}
			}
			
			// Fallback: Native download method
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
			
		} catch (error) {
			console.error('Error generating contract:', error);
			alert('Failed to generate contract. Please try again.');
		} finally {
			isGenerating = false;
		}
	};
</script>

<div class="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100">
	<h2 class="text-2xl font-bold text-gray-800 mb-6">Contract Details</h2>
	
	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-8">
		<!-- Client Information Section -->
		<div class="space-y-4">
			<h3 class="text-lg font-semibold text-gray-700 border-b pb-2">Client Information</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<!-- Client Name -->
				<div class="space-y-2">
					<label for="clientName" class="block text-sm font-medium text-gray-700">Client Name</label>
					<input
						type="text"
						id="clientName"
						bind:value={formData.clientName}
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
						placeholder="John Doe"
					/>
					{#if errors.clientName}
						<p class="text-red-500 text-xs mt-1">{errors.clientName}</p>
					{/if}
				</div>

				<!-- Client Phone -->
				<div class="space-y-2">
					<label for="clientPhone" class="block text-sm font-medium text-gray-700">Phone Number</label>
					<input
						type="tel"
						id="clientPhone"
						bind:value={formData.clientPhone}
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
						placeholder="+1 234 567 890"
					/>
					{#if errors.clientPhone}
						<p class="text-red-500 text-xs mt-1">{errors.clientPhone}</p>
					{/if}
				</div>
			</div>

			<!-- Client Address -->
			<div class="space-y-2">
				<label for="clientAddress" class="block text-sm font-medium text-gray-700">Address</label>
				<input
					type="text"
					id="clientAddress"
					bind:value={formData.clientAddress}
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
					placeholder="123 Main St, City, Country"
				/>
				{#if errors.clientAddress}
					<p class="text-red-500 text-xs mt-1">{errors.clientAddress}</p>
				{/if}
			</div>

			<!-- Tax ID -->
			<div class="space-y-2">
				<label for="clientTaxId" class="block text-sm font-medium text-gray-700">Tax ID (Optional)</label>
				<input
					type="text"
					id="clientTaxId"
					bind:value={formData.clientTaxId}
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
					placeholder="Tax Code"
				/>
				{#if errors.clientTaxId}
					<p class="text-red-500 text-xs mt-1">{errors.clientTaxId}</p>
				{/if}
			</div>
		</div>

		<!-- Event Details Section -->
		<div class="space-y-4">
			<h3 class="text-lg font-semibold text-gray-700 border-b pb-2">Event Details</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<!-- Job Name -->
				<div class="space-y-2">
					<label for="jobName" class="block text-sm font-medium text-gray-700">Job Name</label>
					<input
						type="text"
						id="jobName"
						bind:value={formData.jobName}
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
						placeholder="e.g., MC, Performer"
					/>
					{#if errors.jobName}
						<p class="text-red-500 text-xs mt-1">{errors.jobName}</p>
					{/if}
				</div>

				<!-- Event Name -->
				<div class="space-y-2">
					<label for="eventName" class="block text-sm font-medium text-gray-700">Event Name</label>
					<input
						type="text"
						id="eventName"
						bind:value={formData.eventName}
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
						placeholder="Event name"
					/>
					{#if errors.eventName}
						<p class="text-red-500 text-xs mt-1">{errors.eventName}</p>
					{/if}
				</div>

				<!-- Number of Performances -->
				<div class="space-y-2">
					<label for="numberOfPerformances" class="block text-sm font-medium text-gray-700">Number of Performances</label>
					<input
						type="number"
						id="numberOfPerformances"
						bind:value={formData.numberOfPerformances}
						min="1"
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
					/>
					{#if errors.numberOfPerformances}
						<p class="text-red-500 text-xs mt-1">{errors.numberOfPerformances}</p>
					{/if}
				</div>

				<!-- Event Location -->
				<div class="space-y-2">
					<label for="eventLocation" class="block text-sm font-medium text-gray-700">Event Location</label>
					<input
						type="text"
						id="eventLocation"
						bind:value={formData.eventLocation}
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
						placeholder="Venue name"
					/>
					{#if errors.eventLocation}
						<p class="text-red-500 text-xs mt-1">{errors.eventLocation}</p>
					{/if}
				</div>

				<!-- First Performance Time -->
				<div class="space-y-2">
					<label for="firstPerformanceTime" class="block text-sm font-medium text-gray-700">Performance Time</label>
					<input
						type="text"
						id="firstPerformanceTime"
						bind:value={formData.firstPerformanceTime}
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
						placeholder="e.g., 7:00 PM"
					/>
					{#if errors.firstPerformanceTime}
						<p class="text-red-500 text-xs mt-1">{errors.firstPerformanceTime}</p>
					{/if}
				</div>
			</div>

			<!-- Job Content -->
			<div class="space-y-2">
				<label for="jobContent" class="block text-sm font-medium text-gray-700">Job Content</label>
				<textarea
					id="jobContent"
					bind:value={formData.jobContent}
					rows="3"
					class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
					placeholder="Describe the job responsibilities..."
				></textarea>
				{#if errors.jobContent}
					<p class="text-red-500 text-xs mt-1">{errors.jobContent}</p>
				{/if}
			</div>
		</div>

		<!-- Bank Details Section -->
		<div class="space-y-4">
			<h3 class="text-lg font-semibold text-gray-700 border-b pb-2">Bank Details</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<!-- Bank Name -->
				<div class="space-y-2">
					<label for="bankName" class="block text-sm font-medium text-gray-700">Bank Name</label>
					<input
						type="text"
						id="bankName"
						bind:value={formData.bankName}
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
						placeholder="e.g., Vietcombank"
					/>
					{#if errors.bankName}
						<p class="text-red-500 text-xs mt-1">{errors.bankName}</p>
					{/if}
				</div>

				<!-- Account Number -->
				<div class="space-y-2">
					<label for="accountNumber" class="block text-sm font-medium text-gray-700">Account Number</label>
					<input
						type="text"
						id="accountNumber"
						bind:value={formData.accountNumber}
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
						placeholder="Account number"
					/>
					{#if errors.accountNumber}
						<p class="text-red-500 text-xs mt-1">{errors.accountNumber}</p>
					{/if}
				</div>
			</div>
		</div>

		<!-- Financial Details Section -->
		<div class="space-y-4">
			<h3 class="text-lg font-semibold text-gray-700 border-b pb-2">Financial Details</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<!-- Net Fee -->
				<div class="space-y-2">
					<label for="netFee" class="block text-sm font-medium text-gray-700">Net Service Fee (VND)</label>
					<input
						type="number"
						id="netFee"
						bind:value={formData.netFee}
						min="0"
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
					/>
					{#if errors.netFee}
						<p class="text-red-500 text-xs mt-1">{errors.netFee}</p>
					{/if}
				</div>

				<!-- Tax Rate -->
				<div class="space-y-2">
					<label for="taxRate" class="block text-sm font-medium text-gray-700">PIT Tax Rate (%)</label>
					<select
						id="taxRate"
						bind:value={formData.taxRate}
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
					>
						{#each companyConfig.taxRates as rate}
							<option value={rate}>{rate}%</option>
						{/each}
					</select>
					{#if errors.taxRate}
						<p class="text-red-500 text-xs mt-1">{errors.taxRate}</p>
					{/if}
				</div>
			</div>

			<!-- Calculation Preview -->
			<div class="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-1 text-sm text-gray-700">
				<div class="flex justify-between">
					<span>Net Fee (Paid to Staff):</span>
					<span class="font-medium">{formatCurrency(formData.netFee)}</span>
				</div>
				<div class="flex justify-between">
					<span>Tax Amount ({formData.taxRate}%):</span>
					<span class="font-medium">{formatCurrency(taxAmount)}</span>
				</div>
				<div class="flex justify-between pt-2 border-t border-gray-200 font-bold text-gray-900">
					<span>Total Gross Fee:</span>
					<span>{formatCurrency(grossFee)}</span>
				</div>
			</div>
		</div>

		<!-- Contract Period Section -->
		<div class="space-y-4">
			<h3 class="text-lg font-semibold text-gray-700 border-b pb-2">Contract Period</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<!-- Start Date -->
				<div class="space-y-2">
					<label for="startDate" class="block text-sm font-medium text-gray-700">Start Date</label>
					<input
						type="date"
						id="startDate"
						bind:value={formData.startDate}
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
					/>
					{#if errors.startDate}
						<p class="text-red-500 text-xs mt-1">{errors.startDate}</p>
					{/if}
				</div>

				<!-- End Date -->
				<div class="space-y-2">
					<label for="endDate" class="block text-sm font-medium text-gray-700">End Date</label>
					<input
						type="date"
						id="endDate"
						bind:value={formData.endDate}
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
					/>
					{#if errors.endDate}
						<p class="text-red-500 text-xs mt-1">{errors.endDate}</p>
					{/if}
				</div>
			</div>
		</div>

		<button
			type="submit"
			disabled={isGenerating}
			class="w-full flex items-center justify-center px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed font-medium"
		>
			{#if isGenerating}
				<Loader2 class="w-5 h-5 mr-2 animate-spin" />
				Generating Contract...
			{:else}
				Generate Contract
			{/if}
		</button>
	</form>
</div>
