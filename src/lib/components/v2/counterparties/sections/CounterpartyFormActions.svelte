<script lang="ts">
	import { Button } from '$lib/components/ui/button';

	interface Props {
		isSubmitting: boolean;
		isEditing: boolean;
		entityLabel: string;
		onCancel?: () => void;
	}

	let { isSubmitting, isEditing, entityLabel, onCancel }: Props = $props();
</script>

<div class="flex justify-end gap-3">
	{#if onCancel}
		<Button type="button" variant="outline" onclick={onCancel} disabled={isSubmitting}>
			Cancel
		</Button>
	{/if}
	<Button type="submit" disabled={isSubmitting} variant="dark">
		{isSubmitting ? 'Saving...' : isEditing ? `Update ${entityLabel}` : `Create ${entityLabel}`}
	</Button>
</div>
