<script lang="ts">
	import TextField from '$lib/components/TextField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import type { PerformerFormState } from '$lib/state/v2/performerFormState.svelte';

	let { formState }: { formState: PerformerFormState } = $props();
</script>

<FormSection title="Basic Information">
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<TextField
			id="name"
			label="Legal Name"
			bind:value={formState.name}
			required
			placeholder="Full legal name"
		/>

		<TextField
			id="stageName"
			label="Stage Name"
			bind:value={formState.stageName}
			required
			placeholder="DJ Name / Artist Name"
		/>

		<TextField
			id="performerType"
			label="Performer Type"
			bind:value={formState.performerType}
			required
			placeholder="DJ, Band, MC, Dancer, etc."
		/>

		<TextField
			id="genre"
			label="Genre"
			bind:value={formState.genre}
			placeholder="House, Techno, Hip-Hop, etc."
		/>

		<TextField
			id="email"
			label="Email"
			type="email"
			bind:value={formState.email}
			placeholder="performer@example.com"
		/>

		<TextField
			id="phone"
			label="Phone"
			type="tel"
			bind:value={formState.phone}
			placeholder="+84 123 456 789"
		/>

		<TextField
			id="address"
			label="Address"
			bind:value={formState.address}
			placeholder="123 Main St, Ho Chi Minh City"
			class="col-span-full"
		/>
	</div>
</FormSection>
