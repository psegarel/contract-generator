<script lang="ts">
	import FormSection from '$lib/components/FormSection.svelte';

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
		<div>
			<label for="eventTheme" class="block text-sm font-medium text-foreground mb-1">
				Event Theme
			</label>
			<input
				id="eventTheme"
				type="text"
				value={eventTheme}
				oninput={(e) => oneventThemeChange(e.currentTarget.value)}
				class="w-full px-3.5 py-2.5 border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring text-foreground text-sm"
				placeholder="Corporate Gala, Wedding, etc."
			/>
		</div>

		<div>
			<label for="eventType" class="block text-sm font-medium text-foreground mb-1">
				Event Type
			</label>
			<input
				id="eventType"
				type="text"
				value={eventType}
				oninput={(e) => oneventTypeChange(e.currentTarget.value)}
				class="w-full px-3.5 py-2.5 border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring text-foreground text-sm"
				placeholder="Conference, Celebration, etc."
			/>
		</div>

		<div class="col-span-full">
			<label for="eventDescription" class="block text-sm font-medium text-foreground mb-1">
				Event Description
			</label>
			<textarea
				id="eventDescription"
				value={eventDescription}
				oninput={(e) => oneventDescriptionChange(e.currentTarget.value)}
				rows="3"
				class="w-full px-3.5 py-2.5 border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring text-foreground text-sm"
				placeholder="Detailed description of the event..."
			></textarea>
		</div>

		<div class="col-span-full">
			<label for="eventVenue" class="block text-sm font-medium text-foreground mb-1">
				Event Venue <span class="text-destructive">*</span>
			</label>
			<input
				id="eventVenue"
				type="text"
				value={eventVenue}
				oninput={(e) => oneventVenueChange(e.currentTarget.value)}
				required
				class="w-full px-3.5 py-2.5 border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring text-foreground text-sm"
				placeholder="Grand Ballroom, 123 Main St"
			/>
		</div>

		<div>
			<label for="eventDate" class="block text-sm font-medium text-foreground mb-1">
				Event Date <span class="text-destructive">*</span>
			</label>
			<input
				id="eventDate"
				type="date"
				value={eventDate}
				oninput={(e) => oneventDateChange(e.currentTarget.value)}
				required
				class="w-full px-3.5 py-2.5 border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring text-foreground text-sm"
			/>
		</div>

		<div>
			<label for="eventDuration" class="block text-sm font-medium text-foreground mb-1">
				Event Duration
			</label>
			<input
				id="eventDuration"
				type="text"
				value={eventDuration}
				oninput={(e) => oneventDurationChange(e.currentTarget.value)}
				class="w-full px-3.5 py-2.5 border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring text-foreground text-sm"
				placeholder="4 hours, 1 day, etc."
			/>
		</div>

		<div class="col-span-full">
			<label for="expectedAttendance" class="block text-sm font-medium text-foreground mb-1">
				Expected Attendance
			</label>
			<input
				id="expectedAttendance"
				type="text"
				value={expectedAttendance}
				oninput={(e) => onexpectedAttendanceChange(e.currentTarget.value)}
				class="w-full px-3.5 py-2.5 border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring text-foreground text-sm"
				placeholder="200 guests"
			/>
		</div>
	</div>
</FormSection>
