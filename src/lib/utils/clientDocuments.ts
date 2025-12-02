import { storage } from '$lib/config/firebase';
import {
	ref,
	uploadBytes,
	getDownloadURL,
	deleteObject,
	type UploadResult
} from 'firebase/storage';

export interface ClientDocument {
	url: string;
	fileName: string;
	uploadedAt: Date;
	uploadedBy: string;
	size: number;
}

/**
 * Manages client document uploads and deletions
 */
export class ClientDocumentManager {
	private static readonly MAX_FILE_SIZE = 500 * 1024; // 500KB
	private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
	private static readonly EXTENSIONS = ['jpg', 'jpeg', 'png', 'pdf'];

	constructor(private readonly clientId: string) {}

	/**
	 * Validate file before upload
	 */
	private validateFile(file: File): { valid: boolean; error?: string } {
		if (file.size > ClientDocumentManager.MAX_FILE_SIZE) {
			return { valid: false, error: 'File size must be less than 500KB' };
		}

		if (!ClientDocumentManager.ALLOWED_TYPES.includes(file.type)) {
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
		return `client-documents/${this.clientId}/${fileName}`;
	}

	/**
	 * Upload a document
	 */
	async uploadDocument(
		file: File,
		imageNumber: 1 | 2,
		userId: string
	): Promise<ClientDocument> {
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
	async deleteDocument(imageNumber: 1 | 2): Promise<void> {
		// Try all possible extensions since we don't know which one was uploaded
		for (const ext of ClientDocumentManager.EXTENSIONS) {
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
	 * Delete all documents for this client
	 */
	async deleteAllDocuments(): Promise<void> {
		await Promise.all([this.deleteDocument(1), this.deleteDocument(2)]);
	}
}

// Legacy function exports for backward compatibility
export async function uploadClientDocument(
	clientId: string,
	file: File,
	imageNumber: 1 | 2,
	userId: string
): Promise<ClientDocument> {
	const manager = new ClientDocumentManager(clientId);
	return manager.uploadDocument(file, imageNumber, userId);
}

export async function deleteClientDocument(clientId: string, imageNumber: 1 | 2): Promise<void> {
	const manager = new ClientDocumentManager(clientId);
	return manager.deleteDocument(imageNumber);
}

export async function deleteAllClientDocuments(clientId: string): Promise<void> {
	const manager = new ClientDocumentManager(clientId);
	return manager.deleteAllDocuments();
}
