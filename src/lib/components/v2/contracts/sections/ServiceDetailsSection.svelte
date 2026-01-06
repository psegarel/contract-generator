<script lang="ts">
	interface Props {
		jobName: string;
		jobContent: string;
		numberOfPerformances: number;
		firstPerformanceTime: string;
		startDate: string;
		endDate: string;
		eventLocation: string;
		onjobNameChange: (value: string) => void;
		onjobContentChange: (value: string) => void;
		onnumberOfPerformancesChange: (value: number) => void;
		onfirstPerformanceTimeChange: (value: string) => void;
		onstartDateChange: (value: string) => void;
		onendDateChange: (value: string) => void;
		oneventLocationChange: (value: string) => void;
	}

	let {
		jobName,
		jobContent,
		numberOfPerformances,
		firstPerformanceTime,
		startDate,
		endDate,
		eventLocation,
		onjobNameChange,
		onjobContentChange,
		onnumberOfPerformancesChange,
		onfirstPerformanceTimeChange,
		onstartDateChange,
		onendDateChange,
		oneventLocationChange
	}: Props = $props();
</script>

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Service Details</h3>
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<div class="col-span-full">
			<label for="jobName" class="block text-sm font-medium text-gray-700 mb-1">
				Job Name <span class="text-red-500">*</span>
			</label>
			<input
				id="jobName"
				type="text"
				value={jobName}
				oninput={(e) => onjobNameChange(e.currentTarget.value)}
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="DJ Services, Sound System Rental, etc."
			/>
		</div>

		<div class="col-span-full">
			<label for="jobContent" class="block text-sm font-medium text-gray-700 mb-1">
				Job Content <span class="text-red-500">*</span>
			</label>
			<textarea
				id="jobContent"
				value={jobContent}
				oninput={(e) => onjobContentChange(e.currentTarget.value)}
				required
				rows="4"
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="Detailed description of services provided..."
			></textarea>
		</div>

		<div>
			<label for="numberOfPerformances" class="block text-sm font-medium text-gray-700 mb-1">
				Number of Performances <span class="text-red-500">*</span>
			</label>
			<input
				id="numberOfPerformances"
				type="number"
				value={numberOfPerformances}
				oninput={(e) => onnumberOfPerformancesChange(Number(e.currentTarget.value))}
				min="1"
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			/>
		</div>

		<div>
			<label for="firstPerformanceTime" class="block text-sm font-medium text-gray-700 mb-1">
				First Performance Time <span class="text-red-500">*</span>
			</label>
			<input
				id="firstPerformanceTime"
				type="time"
				value={firstPerformanceTime}
				oninput={(e) => onfirstPerformanceTimeChange(e.currentTarget.value)}
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			/>
		</div>

		<div>
			<label for="startDate" class="block text-sm font-medium text-gray-700 mb-1">
				Start Date <span class="text-red-500">*</span>
			</label>
			<input
				id="startDate"
				type="date"
				value={startDate}
				oninput={(e) => onstartDateChange(e.currentTarget.value)}
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			/>
		</div>

		<div>
			<label for="endDate" class="block text-sm font-medium text-gray-700 mb-1">
				End Date <span class="text-red-500">*</span>
			</label>
			<input
				id="endDate"
				type="date"
				value={endDate}
				oninput={(e) => onendDateChange(e.currentTarget.value)}
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			/>
		</div>

		<div class="col-span-full">
			<label for="eventLocation" class="block text-sm font-medium text-gray-700 mb-1">
				Event Location <span class="text-red-500">*</span>
			</label>
			<input
				id="eventLocation"
				type="text"
				value={eventLocation}
				oninput={(e) => oneventLocationChange(e.currentTarget.value)}
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="123 Main St, Ho Chi Minh City"
			/>
		</div>
	</div>
</div>
