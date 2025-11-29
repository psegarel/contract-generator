<script lang="ts">
	import { contractSchema, type ContractData } from '$lib/schemas/contract';
	import { generateContract } from '$lib/utils/generator';
	import { companyConfig } from '$lib/config/company';
	import { Loader2 } from 'lucide-svelte';
import { Input } from '$lib/components/ui/input';
import { Label } from '$lib/components/ui/label';
import { Textarea } from '$lib/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
import { Card } from '$lib/components/ui/card';
import { Button } from '$lib/components/ui/button';

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
let taxRateStr = $state(String(formData.taxRate));
$effect(() => { formData.taxRate = Number(taxRateStr); });

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

<div class="max-w-4xl mx-auto">
	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-8">
		<!-- Client Information Section -->
		<div class="space-y-4">
			<h3 class="text-lg font-medium text-foreground border-b border-border pb-3">Client Information</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- Client Name -->
				<div class="space-y-2">
					<Label for="clientName">Client Name</Label>
					<Input id="clientName" type="text" bind:value={formData.clientName} placeholder="John Doe" />
					{#if errors.clientName}
						<p class="text-red-600 dark:text-red-400 text-xs mt-1">{errors.clientName}</p>
					{/if}
				</div>

				<!-- Client Phone -->
				<div class="space-y-2">
					<Label for="clientPhone">Phone Number</Label>
					<Input id="clientPhone" type="tel" bind:value={formData.clientPhone} placeholder="+1 234 567 890" />
					{#if errors.clientPhone}
						<p class="text-red-600 dark:text-red-400 text-xs mt-1">{errors.clientPhone}</p>
					{/if}
				</div>
			</div>

			<!-- Client Address -->
			<div class="space-y-2">
				<label for="clientAddress" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
				<input
					type="text"
					id="clientAddress"
					bind:value={formData.clientAddress}
					class="w-full px-3 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#2a2a2a] rounded-md text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] transition-colors"
					placeholder="123 Main St, City, Country"
				/>
				{#if errors.clientAddress}
					<p class="text-red-600 dark:text-red-400 text-xs mt-1">{errors.clientAddress}</p>
				{/if}
			</div>

			<!-- Tax ID -->
			<div class="space-y-2">
				<label for="clientTaxId" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Tax ID (Optional)</label>
				<input
					type="text"
					id="clientTaxId"
					bind:value={formData.clientTaxId}
					class="w-full px-3 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#2a2a2a] rounded-md text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] transition-colors"
					placeholder="Tax Code"
				/>
				{#if errors.clientTaxId}
					<p class="text-red-600 dark:text-red-400 text-xs mt-1">{errors.clientTaxId}</p>
				{/if}
			</div>
		</div>

		<!-- Event Details Section -->
		<div class="space-y-4">
			<h3 class="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-[#2a2a2a] pb-3">Event Details</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- Job Name -->
				<div class="space-y-2">
					<label for="jobName" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Job Name</label>
					<input
						type="text"
						id="jobName"
						bind:value={formData.jobName}
						class="w-full px-3 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#2a2a2a] rounded-md text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] transition-colors"
						placeholder="e.g., MC, Performer"
					/>
					{#if errors.jobName}
						<p class="text-red-600 dark:text-red-400 text-xs mt-1">{errors.jobName}</p>
					{/if}
				</div>

				<!-- Event Name -->
				<div class="space-y-2">
					<label for="eventName" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Event Name</label>
					<input
						type="text"
						id="eventName"
						bind:value={formData.eventName}
						class="w-full px-3 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#2a2a2a] rounded-md text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] transition-colors"
						placeholder="Event name"
					/>
					{#if errors.eventName}
						<p class="text-red-600 dark:text-red-400 text-xs mt-1">{errors.eventName}</p>
					{/if}
				</div>

				<!-- Number of Performances -->
				<div class="space-y-2">
					<label for="numberOfPerformances" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Number of Performances</label>
					<input
						type="number"
						id="numberOfPerformances"
						bind:value={formData.numberOfPerformances}
						min="1"
						class="w-full px-3 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#2a2a2a] rounded-md text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] transition-colors"
					/>
					{#if errors.numberOfPerformances}
						<p class="text-red-600 dark:text-red-400 text-xs mt-1">{errors.numberOfPerformances}</p>
					{/if}
				</div>

				<!-- Event Location -->
				<div class="space-y-2">
					<label for="eventLocation" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Event Location</label>
					<input
						type="text"
						id="eventLocation"
						bind:value={formData.eventLocation}
						class="w-full px-3 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#2a2a2a] rounded-md text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] transition-colors"
						placeholder="Venue name"
					/>
					{#if errors.eventLocation}
						<p class="text-red-600 dark:text-red-400 text-xs mt-1">{errors.eventLocation}</p>
					{/if}
				</div>

				<!-- First Performance Time -->
				<div class="space-y-2">
					<label for="firstPerformanceTime" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Performance Time</label>
					<input
						type="text"
						id="firstPerformanceTime"
						bind:value={formData.firstPerformanceTime}
						class="w-full px-3 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#2a2a2a] rounded-md text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] transition-colors"
						placeholder="e.g., 7:00 PM"
					/>
					{#if errors.firstPerformanceTime}
						<p class="text-red-600 dark:text-red-400 text-xs mt-1">{errors.firstPerformanceTime}</p>
					{/if}
				</div>
			</div>

			<!-- Job Content -->
			<div class="space-y-2">
				<label for="jobContent" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Job Content</label>
				<textarea
					id="jobContent"
					bind:value={formData.jobContent}
					rows="3"
					class="w-full px-3 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#2a2a2a] rounded-md text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] transition-colors"
					placeholder="Describe the job responsibilities..."
				></textarea>
				{#if errors.jobContent}
					<p class="text-red-600 dark:text-red-400 text-xs mt-1">{errors.jobContent}</p>
				{/if}
			</div>
		</div>

		<!-- Bank Details Section -->
		<div class="space-y-4">
			<h3 class="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-[#2a2a2a] pb-3">Bank Details</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- Bank Name -->
				<div class="space-y-2">
					<Label for="bankName">Bank Name</Label>
					<Input id="bankName" type="text" bind:value={formData.bankName} placeholder="e.g., Vietcombank" />
					{#if errors.bankName}
						<p class="text-red-600 dark:text-red-400 text-xs mt-1">{errors.bankName}</p>
					{/if}
				</div>
				
				<!-- Account Number -->
				<div class="space-y-2">
					<Label for="accountNumber">Account Number</Label>
					<Input id="accountNumber" type="text" bind:value={formData.accountNumber} placeholder="Account number" />
					{#if errors.accountNumber}
						<p class="text-red-600 dark:text-red-400 text-xs mt-1">{errors.accountNumber}</p>
					{/if}
				</div>
			</div>
		</div>

		<!-- Financial Details Section -->
		<div class="space-y-4">
			<h3 class="text-lg font-medium text-foreground border-b border-border pb-3">Financial Details</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- Net Fee -->
				<div class="space-y-2">
					<Label for="netFee">Net Service Fee (VND)</Label>
					<Input id="netFee" type="number" bind:value={formData.netFee} min="0" />
					{#if errors.netFee}
						<p class="text-red-600 dark:text-red-400 text-xs mt-1">{errors.netFee}</p>
					{/if}
				</div>

				<!-- Tax Rate -->
				<div class="space-y-2">
					<Label for="taxRate">PIT Tax Rate (%)</Label>
					<Select type="single" bind:value={taxRateStr}>
						<SelectTrigger class="w-full">
							<span data-slot="select-value">{taxRateStr ? `${taxRateStr}%` : 'Select rate'}</span>
						</SelectTrigger>
						<SelectContent>
							{#each companyConfig.taxRates as rate}
								<SelectItem value={String(rate)}>{rate}%</SelectItem>
							{/each}
						</SelectContent>
					</Select>
					{#if errors.taxRate}
						<p class="text-red-600 dark:text-red-400 text-xs mt-1">{errors.taxRate}</p>
					{/if}
				</div>
			</div>

			<!-- Calculation Preview -->
			<Card class="p-4 space-y-2 text-sm">
				<div class="flex justify-between text-muted-foreground">
					<span>Net Fee (Paid to Staff):</span>
					<span class="font-medium text-foreground">{formatCurrency(formData.netFee)}</span>
				</div>
				<div class="flex justify-between text-muted-foreground">
					<span>Tax Amount ({formData.taxRate}%):</span>
					<span class="font-medium text-foreground">{formatCurrency(taxAmount)}</span>
				</div>
				<div class="flex justify-between pt-2 border-t border-border font-medium text-foreground">
					<span>Total Gross Fee:</span>
					<span>{formatCurrency(grossFee)}</span>
				</div>
			</Card>
		</div>

		<!-- Contract Period Section -->
		<div class="space-y-4">
			<h3 class="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-[#2a2a2a] pb-3">Contract Period</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- Start Date -->
				<div class="space-y-2">
					<Label for="startDate">Start Date</Label>
					<Input id="startDate" type="date" bind:value={formData.startDate} />
					{#if errors.startDate}
						<p class="text-red-600 dark:text-red-400 text-xs mt-1">{errors.startDate}</p>
					{/if}
				</div>

				<!-- End Date -->
				<div class="space-y-2">
					<Label for="endDate">End Date</Label>
					<Input id="endDate" type="date" bind:value={formData.endDate} />
					{#if errors.endDate}
						<p class="text-red-600 dark:text-red-400 text-xs mt-1">{errors.endDate}</p>
					{/if}
				</div>
			</div>
		</div>

		<Button type="submit" disabled={isGenerating} class="w-full" size="lg">
			{#if isGenerating}
				<Loader2 class="w-5 h-5 mr-2 animate-spin" />
				Generating Contract...
			{:else}
				Generate Contract
			{/if}
		</Button>
	</form>
</div>
