<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Upload, X, FileText, Image as ImageIcon } from 'lucide-svelte';
	import type { DocumentMetadata } from '$lib/utils/clients';

	interface Props {
		/** Label for the upload input */
		label: string;
		/** Current document metadata if file exists */
		document?: DocumentMetadata;
		/** Callback when file is selected */
		onFileSelect: (file: File) => void;
		/** Callback when file is deleted */
		onFileDelete: () => void;
		/** Whether upload is in progress */
		uploading?: boolean;
		/** Whether component is disabled */
		disabled?: boolean;
	}

	let {
		label,
		document,
		onFileSelect,
		onFileDelete,
		uploading = false,
		disabled = false
	}: Props = $props();

	let fileInput = $state<HTMLInputElement | undefined>();

	// Action to capture the file input element reference
	function captureFileInput(node: HTMLInputElement) {
		fileInput = node;
		return {
			destroy() {
				fileInput = undefined;
			}
		};
	}

	function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (file) {
			// Validate file size (500KB)
			if (file.size > 500 * 1024) {
				alert('File size must be less than 500KB');
				target.value = '';
				return;
			}

			// Validate file type
			const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
			if (!allowedTypes.includes(file.type)) {
				alert('Only JPG, PNG, and PDF files are allowed');
				target.value = '';
				return;
			}

			onFileSelect(file);
		}
	}

	function handleDelete() {
		if (fileInput) {
			fileInput.value = '';
		}
		onFileDelete();
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}

	function isPdf(fileName: string): boolean {
		const ext = fileName.split('.').pop()?.toLowerCase();
		return ext === 'pdf';
	}
</script>

<div class="space-y-2">
	<Label>{label}</Label>

	{#if document}
		<!-- Show uploaded file -->
		<div class="border border-border rounded-lg p-3 bg-muted/50">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3 flex-1 min-w-0">
					{#if isPdf(document.fileName)}
						<FileText class="h-5 w-5 text-muted-foreground shrink-0" />
					{:else}
						<ImageIcon class="h-5 w-5 text-muted-foreground shrink-0" />
					{/if}
					<div class="flex-1 min-w-0">
						<p class="text-sm font-medium text-foreground truncate">
							{document.fileName}
						</p>
						<p class="text-xs text-muted-foreground">
							{formatFileSize(document.size)}
						</p>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<a
						href={document.url}
						target="_blank"
						rel="noopener noreferrer"
						class="text-sm text-primary hover:underline"
					>
						View
					</a>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onclick={handleDelete}
						disabled={disabled || uploading}
						class="h-8 w-8 p-0"
					>
						<X class="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	{:else}
		<!-- Show upload button -->
		<div class="relative">
			<input
				type="file"
				use:captureFileInput
				onchange={handleFileChange}
				accept="image/jpeg,image/png,image/jpg,application/pdf"
				disabled={disabled || uploading}
				class="hidden"
			/>
			<Button
				type="button"
				variant="outline"
				size="sm"
				onclick={() => fileInput?.click()}
				disabled={disabled || uploading}
				class="w-full"
			>
				{#if uploading}
					<span class="flex items-center gap-2">
						<span class="animate-spin">⏳</span>
						<span>Uploading...</span>
					</span>
				{:else}
					<span class="flex items-center gap-2">
						<Upload class="h-4 w-4" />
						<span>Choose File</span>
					</span>
				{/if}
			</Button>
		</div>
		<p class="text-xs text-muted-foreground">JPG, PNG, or PDF. Max 500KB.</p>
	{/if}
</div>
