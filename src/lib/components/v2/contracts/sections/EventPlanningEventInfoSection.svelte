<script lang="ts">
	import FormSection from '$lib/components/FormSection.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import TextareaField from '$lib/components/TextareaField.svelte';

	interface Props {
		eventTheme: string;
		eventType: string;
		eventDescription: string;
		eventVenue: string;
		eventDate: string;
		eventDuration: string;
		expectedAttendance: string;
		oneventThemeChange: (value: string) => void;
		oneventTypeChange: (value: string) => void;
		oneventDescriptionChange: (value: string) => void;
		oneventVenueChange: (value: string) => void;
		oneventDateChange: (value: string) => void;
		oneventDurationChange: (value: string) => void;
		onexpectedAttendanceChange: (value: string) => void;
	}

	let {
		eventTheme,
		eventType,
		eventDescription,
		eventVenue,
		eventDate,
		eventDuration,
		expectedAttendance,
		oneventThemeChange,
		oneventTypeChange,
		oneventDescriptionChange,
		oneventVenueChange,
		oneventDateChange,
		oneventDurationChange,
		onexpectedAttendanceChange
	}: Props = $props();
</script>

<FormSection title="Event Information">
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		<TextField
			id="eventTheme"
			label="Event Theme"
			value={eventTheme}
			oninput={(e) => oneventThemeChange(e.currentTarget.value)}
			placeholder="Corporate Gala, Wedding, etc."
		/>

		<TextField
			id="eventType"
			label="Event Type"
			value={eventType}
			oninput={(e) => oneventTypeChange(e.currentTarget.value)}
			placeholder="Conference, Celebration, etc."
		/>

		<TextareaField
			class="col-span-full"
			id="eventDescription"
			label="Event Description"
			value={eventDescription}
			oninput={(e) => oneventDescriptionChange(e.currentTarget.value)}
			rows={3}
			placeholder="Detailed description of the event..."
		/>

		<TextField
			class="col-span-full"
			id="eventVenue"
			label="Event Venue"
			value={eventVenue}
			oninput={(e) => oneventVenueChange(e.currentTarget.value)}
			required
			placeholder="Grand Ballroom, 123 Main St"
		/>

		<TextField
			id="eventDate"
			label="Event Date"
			type="date"
			value={eventDate}
			oninput={(e) => oneventDateChange(e.currentTarget.value)}
			required
		/>

		<TextField
			id="eventDuration"
			label="Event Duration"
			value={eventDuration}
			oninput={(e) => oneventDurationChange(e.currentTarget.value)}
			placeholder="4 hours, 1 day, etc."
		/>

		<TextField
			class="col-span-full"
			id="expectedAttendance"
			label="Expected Attendance"
			value={expectedAttendance}
			oninput={(e) => onexpectedAttendanceChange(e.currentTarget.value)}
			placeholder="200 guests"
		/>
	</div>
</FormSection>
