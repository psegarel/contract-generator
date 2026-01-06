<script lang="ts">
	interface Props {
		planningMeetingDays: number;
		performerBookingDeadline: string;
		technicalSetupDate: string;
		eventExecutionDate: string;
		setupCommencementTime: string;
		eventExecutionDuration: string;
		breakdownCompletionDateTime: string;
		onplanningMeetingDaysChange: (value: number) => void;
		onperformerBookingDeadlineChange: (value: string) => void;
		ontechnicalSetupDateChange: (value: string) => void;
		oneventExecutionDateChange: (value: string) => void;
		onsetupCommencementTimeChange: (value: string) => void;
		oneventExecutionDurationChange: (value: string) => void;
		onbreakdownCompletionDateTimeChange: (value: string) => void;
	}

	let {
		planningMeetingDays,
		performerBookingDeadline,
		technicalSetupDate,
		eventExecutionDate,
		setupCommencementTime,
		eventExecutionDuration,
		breakdownCompletionDateTime,
		onplanningMeetingDaysChange,
		onperformerBookingDeadlineChange,
		ontechnicalSetupDateChange,
		oneventExecutionDateChange,
		onsetupCommencementTimeChange,
		oneventExecutionDurationChange,
		onbreakdownCompletionDateTimeChange
	}: Props = $props();
</script>

<div class="bg-white p-6 rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<div>
			<label for="planningMeetingDays" class="block text-sm font-medium text-gray-700 mb-1">
				Planning Meeting Days <span class="text-red-500">*</span>
			</label>
			<input
				id="planningMeetingDays"
				type="number"
				value={planningMeetingDays}
				oninput={(e) => onplanningMeetingDaysChange(Number(e.currentTarget.value))}
				min="1"
				step="1"
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="7"
			/>
		</div>

		<div>
			<label for="performerBookingDeadline" class="block text-sm font-medium text-gray-700 mb-1">
				Performer Booking Deadline <span class="text-red-500">*</span>
			</label>
			<input
				id="performerBookingDeadline"
				type="date"
				value={performerBookingDeadline}
				oninput={(e) => onperformerBookingDeadlineChange(e.currentTarget.value)}
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			/>
		</div>

		<div>
			<label for="technicalSetupDate" class="block text-sm font-medium text-gray-700 mb-1">
				Technical Setup Date <span class="text-red-500">*</span>
			</label>
			<input
				id="technicalSetupDate"
				type="date"
				value={technicalSetupDate}
				oninput={(e) => ontechnicalSetupDateChange(e.currentTarget.value)}
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			/>
		</div>

		<div>
			<label for="eventExecutionDate" class="block text-sm font-medium text-gray-700 mb-1">
				Event Execution Date <span class="text-red-500">*</span>
			</label>
			<input
				id="eventExecutionDate"
				type="date"
				value={eventExecutionDate}
				oninput={(e) => oneventExecutionDateChange(e.currentTarget.value)}
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			/>
		</div>

		<div>
			<label for="setupCommencementTime" class="block text-sm font-medium text-gray-700 mb-1">
				Setup Commencement Time <span class="text-red-500">*</span>
			</label>
			<input
				id="setupCommencementTime"
				type="time"
				value={setupCommencementTime}
				oninput={(e) => onsetupCommencementTimeChange(e.currentTarget.value)}
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			/>
		</div>

		<div>
			<label for="eventExecutionDuration" class="block text-sm font-medium text-gray-700 mb-1">
				Event Execution Duration <span class="text-red-500">*</span>
			</label>
			<input
				id="eventExecutionDuration"
				type="text"
				value={eventExecutionDuration}
				oninput={(e) => oneventExecutionDurationChange(e.currentTarget.value)}
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
				placeholder="8 hours, 2 days, etc."
			/>
		</div>

		<div class="col-span-full">
			<label for="breakdownCompletionDateTime" class="block text-sm font-medium text-gray-700 mb-1">
				Breakdown Completion Date/Time <span class="text-red-500">*</span>
			</label>
			<input
				id="breakdownCompletionDateTime"
				type="datetime-local"
				value={breakdownCompletionDateTime}
				oninput={(e) => onbreakdownCompletionDateTimeChange(e.currentTarget.value)}
				required
				class="w-full px-3.5 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
			/>
		</div>
	</div>
</div>
