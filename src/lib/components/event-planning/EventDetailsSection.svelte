<script lang="ts">
	import { eventInfoSchema, type EventInfo } from '$lib/schemas/eventPlanningContract';
	import { validateWithSchema } from '$lib/utils/eventPlanningFormHelpers';
	import LocationForm from '$lib/components/LocationForm.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import TextareaField from '$lib/components/TextareaField.svelte';
	import type { Location } from '$lib/types/location';

	let {
		data,
		onChange,
		onLocationChange
	}: {
		data: EventInfo;
		onChange: (data: EventInfo, errors: Record<string, string>) => void;
		onLocationChange?: (locationId: string) => void;
	} = $props();

	let errors = $state<Record<string, string>>({});
	let touched = $state<Record<string, boolean>>({});

	function handleChange(field: keyof EventInfo, value: string) {
		touched = { ...touched, [field]: true };
		const newData = { ...data, [field]: value };
		const validation = validateWithSchema(eventInfoSchema, newData, touched);
		errors = validation.displayErrors;
		onChange(newData, validation.allErrors);
	}

	function handleLocationChange(locationData: Location | null, locationId?: string) {
		touched = { ...touched, eventVenue: true };
		const newData = { ...data, eventVenue: locationData?.name || '' };
		const validation = validateWithSchema(eventInfoSchema, newData, touched);
		errors = validation.displayErrors;
		onChange(newData, validation.allErrors);
		onLocationChange?.(locationId || '');
	}
</script>

<div class="p-6 bg-white rounded-lg border border-gray-200">
	<h3 class="text-lg font-semibold text-gray-900 mb-6">Event Details</h3>

	<div class="grid gap-6 grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
		<TextField
			id="eventTheme"
			label="Event Theme"
			value={data.eventTheme}
			placeholder="e.g., Tropical Paradise, Elegant Gala"
			error={errors.eventTheme}
			onInput={(value) => handleChange('eventTheme', value)}
		/>

		<TextField
			id="eventName"
			label="Event Name"
			value={data.eventName}
			required={true}
			placeholder="e.g., Summer Beach Party 2025"
			error={errors.eventName}
			onInput={(value) => handleChange('eventName', value)}
		/>

		<TextField
			id="eventType"
			label="Event Type"
			value={data.eventType}
			placeholder="e.g., Wedding, Corporate Conference, Birthday Party"
			error={errors.eventType}
			onInput={(value) => handleChange('eventType', value)}
		/>

		<div class="col-span-full flex flex-col gap-2">
			<LocationForm showActions={true} onLocationChange={handleLocationChange} />
			{#if errors.eventVenue}
				<p class="text-xs text-red-500 m-0">{errors.eventVenue}</p>
			{/if}
		</div>

		<TextField
			id="eventDate"
			label="Event Date"
			type="date"
			value={data.eventDate}
			required={true}
			error={errors.eventDate}
			onInput={(value) => handleChange('eventDate', value)}
		/>

		<TextField
			id="eventDuration"
			label="Event Duration"
			value={data.eventDuration}
			placeholder="e.g., 18:00 - 01:00 or 6PM - 1AM"
			helperText="Time range for the event"
			error={errors.eventDuration}
			onInput={(value) => handleChange('eventDuration', value)}
		/>

		<TextField
			id="expectedAttendance"
			label="Expected Attendance"
			value={data.expectedAttendance}
			placeholder="e.g., 150-200 or 300 guests"
			helperText="Number of expected guests"
			error={errors.expectedAttendance}
			onInput={(value) => handleChange('expectedAttendance', value)}
		/>

		<div class="col-span-full">
			<TextareaField
				id="eventDescription"
				label="Event Description"
				value={data.eventDescription}
				placeholder="Describe the event, its purpose, special requirements, etc."
				rows={4}
				error={errors.eventDescription}
				onInput={(value) => handleChange('eventDescription', value)}
			/>
		</div>
	</div>
</div>
