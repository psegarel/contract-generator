<script lang="ts">
	import { timelineSchema, type Timeline } from '$lib/schemas/eventPlanningContract';
	import { validateWithSchema } from '$lib/utils/eventPlanningFormHelpers';
	import TextField from '$lib/components/TextField.svelte';

	let {
		data,
		onChange
	}: {
		data: Timeline;
		onChange: (data: Timeline, errors: Record<string, string>) => void;
	} = $props();

	let errors = $state<Record<string, string>>({});
	let touched = $state<Record<string, boolean>>({});

	function handleChange(field: keyof Timeline, value: string) {
		touched = { ...touched, [field]: true };
		const newData =
			field === 'planningMeetingDays'
				? { ...data, [field]: value === '' ? 0 : Number(value) }
				: { ...data, [field]: value };
		const validation = validateWithSchema(timelineSchema, newData, touched);
		errors = validation.displayErrors;
		onChange(newData as Timeline, validation.allErrors);
	}
</script>

<div class="space-y-6">
	<h3 class="text-xl font-bold text-foreground">Timeline & Deadlines</h3>

	<div class="grid gap-6 grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
		<TextField
			id="planningMeetingDays"
			label="Planning Meeting Days"
			type="number"
			value={String(data.planningMeetingDays)}
			required={true}
			placeholder="e.g., 7"
			helperText="Number of days before event for planning meeting"
			error={errors.planningMeetingDays}
			onInput={(value) => handleChange('planningMeetingDays', value)}
		/>

		<TextField
			id="performerBookingDeadline"
			label="Performer Booking Deadline"
			type="date"
			value={data.performerBookingDeadline}
			required={true}
			helperText="Deadline for finalizing performer bookings"
			error={errors.performerBookingDeadline}
			onInput={(value) => handleChange('performerBookingDeadline', value)}
		/>

		<TextField
			id="technicalSetupDate"
			label="Technical Setup Date"
			type="date"
			value={data.technicalSetupDate}
			required={true}
			helperText="Date for technical equipment setup"
			error={errors.technicalSetupDate}
			onInput={(value) => handleChange('technicalSetupDate', value)}
		/>

		<TextField
			id="eventExecutionDate"
			label="Event Execution Date"
			type="date"
			value={data.eventExecutionDate}
			required={true}
			helperText="Main event date"
			error={errors.eventExecutionDate}
			onInput={(value) => handleChange('eventExecutionDate', value)}
		/>

		<TextField
			id="setupCommencementTime"
			label="Setup Commencement Time"
			type="time"
			value={data.setupCommencementTime}
			required={true}
			placeholder="e.g., 08:00"
			helperText="Time when setup begins"
			error={errors.setupCommencementTime}
			onInput={(value) => handleChange('setupCommencementTime', value)}
		/>

		<TextField
			id="eventExecutionDuration"
			label="Event Execution Duration"
			value={data.eventExecutionDuration}
			required={true}
			placeholder="e.g., 6 hours or 18:00 - 00:00"
			helperText="Duration or time range of event execution"
			error={errors.eventExecutionDuration}
			onInput={(value) => handleChange('eventExecutionDuration', value)}
		/>

		<TextField
			id="breakdownCompletionDateTime"
			label="Breakdown Completion Date & Time"
			type="datetime-local"
			value={data.breakdownCompletionDateTime}
			required={true}
			helperText="Date and time when breakdown must be completed"
			error={errors.breakdownCompletionDateTime}
			onInput={(value) => handleChange('breakdownCompletionDateTime', value)}
		/>
	</div>
</div>
