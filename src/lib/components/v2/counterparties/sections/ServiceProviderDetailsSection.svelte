<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import TextField from '$lib/components/TextField.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import type { ServiceProviderFormState } from '$lib/state/v2/serviceProviderFormState.svelte';

	let { formState }: { formState: ServiceProviderFormState } = $props();
</script>

<FormSection title="Service Details">
	<div class="grid grid-cols-1 gap-4">
		<div class="space-y-2">
			<div class="flex gap-2">
				<TextField
					id="typicalDeliverables"
					label="Typical Deliverables"
					class="flex-1"
					bind:value={formState.newDeliverable}
					onkeydown={(event) => {
						if (event.key === 'Enter') {
							event.preventDefault();
							formState.addDeliverable();
						}
					}}
					placeholder="e.g., 200 meals, 4 hours coverage"
				/>
				<Button type="button" variant="outline" onclick={() => formState.addDeliverable()}>
					Add
				</Button>
			</div>
			{#if formState.typicalDeliverables.length > 0}
				<div class="flex flex-wrap gap-2">
					{#each formState.typicalDeliverables as deliverable, index (index)}
						<span
							class="inline-flex items-center gap-1 rounded-sm bg-muted px-3 py-1 text-sm text-foreground"
						>
							{deliverable}
							<Button
								type="button"
								variant="ghost"
								size="sm"
								class="ml-1 h-auto p-0 text-muted-foreground hover:text-foreground"
								onclick={() => formState.removeDeliverable(index)}
							>
								&times;
							</Button>
						</span>
					{/each}
				</div>
			{/if}
		</div>

		<div class="space-y-2">
			<div class="flex gap-2">
				<TextField
					id="equipmentProvided"
					label="Equipment Provided"
					class="flex-1"
					bind:value={formState.newEquipment}
					onkeydown={(event) => {
						if (event.key === 'Enter') {
							event.preventDefault();
							formState.addEquipment();
						}
					}}
					placeholder="e.g., Cameras, Lighting rig"
				/>
				<Button type="button" variant="outline" onclick={() => formState.addEquipment()}>
					Add
				</Button>
			</div>
			{#if formState.equipmentProvided.length > 0}
				<div class="flex flex-wrap gap-2">
					{#each formState.equipmentProvided as equipment, index (index)}
						<span
							class="inline-flex items-center gap-1 rounded-sm bg-muted px-3 py-1 text-sm text-foreground"
						>
							{equipment}
							<Button
								type="button"
								variant="ghost"
								size="sm"
								class="ml-1 h-auto p-0 text-muted-foreground hover:text-foreground"
								onclick={() => formState.removeEquipment(index)}
							>
								&times;
							</Button>
						</span>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</FormSection>
