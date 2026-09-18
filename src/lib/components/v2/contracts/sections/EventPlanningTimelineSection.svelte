<script lang="ts">
	import FormSection from '$lib/components/FormSection.svelte';
	import TextField from '$lib/components/TextField.svelte';

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

<FormSection title="Timeline">
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<TextField
			id="planningMeetingDays"
			label="Planning Meeting Days"
			type="number"
			value={planningMeetingDays}
			oninput={(e) => onplanningMeetingDaysChange(Number(e.currentTarget.value))}
			min={1}
			step={1}
			required
			placeholder="7"
		/>

		<TextField
			id="performerBookingDeadline"
			label="Performer Booking Deadline"
			type="date"
			value={performerBookingDeadline}
			oninput={(e) => onperformerBookingDeadlineChange(e.currentTarget.value)}
			required
		/>

		<TextField
			id="technicalSetupDate"
			label="Technical Setup Date"
			type="date"
			value={technicalSetupDate}
			oninput={(e) => ontechnicalSetupDateChange(e.currentTarget.value)}
			required
		/>

		<TextField
			id="eventExecutionDate"
			label="Event Execution Date"
			type="date"
			value={eventExecutionDate}
			oninput={(e) => oneventExecutionDateChange(e.currentTarget.value)}
			required
		/>

		<TextField
			id="setupCommencementTime"
			label="Setup Commencement Time"
			type="time"
			value={setupCommencementTime}
			oninput={(e) => onsetupCommencementTimeChange(e.currentTarget.value)}
			required
		/>

		<TextField
			id="eventExecutionDuration"
			label="Event Execution Duration"
			value={eventExecutionDuration}
			oninput={(e) => oneventExecutionDurationChange(e.currentTarget.value)}
			required
			placeholder="8 hours, 2 days, etc."
		/>

		<TextField
			class="col-span-full"
			id="breakdownCompletionDateTime"
			label="Breakdown Completion Date/Time"
			type="datetime-local"
			value={breakdownCompletionDateTime}
			oninput={(e) => onbreakdownCompletionDateTimeChange(e.currentTarget.value)}
			required
		/>
	</div>
</FormSection>
