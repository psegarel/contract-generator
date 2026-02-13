import { storage } from '$lib/config/firebase';
import {
	ref,
	uploadBytes,
	getDownloadURL,
	deleteObject,
	type UploadResult
} from 'firebase/storage';
import type { DocumentMetadata } from '$lib/types/v2/counterparty';

/**
 * Manages counterparty document uploads and deletions
 */
export class CounterpartyDocumentManager {
	private static readonly MAX_FILE_SIZE = 500 * 1024; // 500KB
	private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
	private static readonly EXTENSIONS = ['jpg', 'jpeg', 'png', 'pdf'];

	constructor(private readonly counterpartyId: string) {}

	/**
	 * Validate file before upload
	 */
	private validateFile(file: File): { valid: boolean; error?: string } {
		if (file.size > CounterpartyDocumentManager.MAX_FILE_SIZE) {
			return { valid: false, error: 'File size must be less than 500KB' };
		}

		if (!CounterpartyDocumentManager.ALLOWED_TYPES.includes(file.type)) {
			return {
				valid: false,
				error: 'Only JPG, PNG, and PDF files are allowed'
			};
		}

		return { valid: true };
	}

	/**
	 * Get storage path for a document
	 */
	private getStoragePath(fileName: string): string {
		return `counterparty-documents/${this.counterpartyId}/${fileName}`;
	}

	/**
	 * Upload a document
	 */
	async uploadDocument(
		file: File,
		imageNumber: 1 | 2 | 3 | 4 | 5,
		userId: string
	): Promise<DocumentMetadata> {
		// Validate file
		const validation = this.validateFile(file);
		if (!validation.valid) {
			throw new Error(validation.error);
		}

		// Create storage reference
		const fileExtension = file.name.split('.').pop() || 'jpg';
		const fileName = `image-${imageNumber}.${fileExtension}`;
		const storageRef = ref(storage, this.getStoragePath(fileName));

		try {
			// Upload file
			const uploadResult: UploadResult = await uploadBytes(storageRef, file);

			// Get download URL
			const url = await getDownloadURL(uploadResult.ref);

			// Return metadata
			return {
				url,
				fileName: file.name,
				uploadedAt: new Date(),
				uploadedBy: userId,
				size: file.size
			};
		} catch (error) {
			console.error('Error uploading file:', error);
			throw new Error('Failed to upload document');
		}
	}

	/**
	 * Delete a document
	 */
	async deleteDocument(imageNumber: 1 | 2 | 3 | 4 | 5): Promise<void> {
		// Try all possible extensions since we don't know which one was uploaded
		for (const ext of CounterpartyDocumentManager.EXTENSIONS) {
			try {
				const fileName = `image-${imageNumber}.${ext}`;
				const storageRef = ref(storage, this.getStoragePath(fileName));
				await deleteObject(storageRef);
				// If successful, we found and deleted the file
				return;
			} catch (error) {
				// File doesn't exist with this extension, try next one
				continue;
			}
		}
	}

	/**
	 * Delete all documents for this counterparty
	 */
	async deleteAllDocuments(): Promise<void> {
		await Promise.all([
			this.deleteDocument(1),
			this.deleteDocument(2),
			this.deleteDocument(3),
			this.deleteDocument(4),
			this.deleteDocument(5)
		]);
	}
}
