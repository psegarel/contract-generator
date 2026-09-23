<script lang="ts">
	import type { ServiceProviderDocumentNumber } from '$lib/forms/counterparties/serviceProvider';
	import type { ServiceProviderFormState } from '$lib/state/v2/serviceProviderFormState.svelte';
	import FormSection from '$lib/components/FormSection.svelte';
	import FormMessage from '$lib/components/FormMessage.svelte';
	import FileUpload from '$lib/components/FileUpload.svelte';

	interface Props {
		formState: ServiceProviderFormState;
		counterpartyId: string | null;
		onFileUpload: (file: File, imageNumber: ServiceProviderDocumentNumber) => void;
		onFileDelete: (imageNumber: ServiceProviderDocumentNumber) => void;
	}

	let { formState, counterpartyId, onFileUpload, onFileDelete }: Props = $props();
</script>

<FormSection title="ID Documents">
	<p class="mb-4 text-sm text-muted-foreground">
		Upload images of ID/passport documents for validation. You can upload up to 5 documents.
	</p>

	{#if !counterpartyId}
		<FormMessage
			message="Please fill in the basic information first to enable document uploads."
			variant="warning"
		/>
	{:else}
		<div class="space-y-4">
			{#each [1, 2, 3, 4, 5] as imageNum (imageNum)}
				{@const imageNumber = imageNum as ServiceProviderDocumentNumber}
				{@const document = formState.getDocument(imageNumber)}
				{@const isUploading = formState.isUploading(imageNumber)}
				<FileUpload
					label={`Document ${imageNumber}`}
					{document}
					onFileSelect={(file) => onFileUpload(file, imageNumber)}
					onFileDelete={() => onFileDelete(imageNumber)}
					uploading={isUploading}
					disabled={formState.isSubmitting}
				/>
			{/each}
		</div>
	{/if}
</FormSection>
