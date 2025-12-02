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

const MAX_FILE_SIZE = 500 * 1024; // 500KB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

/**
 * Validate file before upload
 */
function validateFile(file: File): { valid: boolean; error?: string } {
	if (file.size > MAX_FILE_SIZE) {
		return { valid: false, error: 'File size must be less than 500KB' };
	}

	if (!ALLOWED_TYPES.includes(file.type)) {
		return {
			valid: false,
			error: 'Only JPG, PNG, and PDF files are allowed'
		};
	}

	return { valid: true };
}

/**
 * Upload a client document to Firebase Storage
 * @param clientId - The client's ID
 * @param file - The file to upload
 * @param imageNumber - Image number (1 or 2)
 * @param userId - The user uploading the document
 * @returns Document metadata
 */
export async function uploadClientDocument(
	clientId: string,
	file: File,
	imageNumber: 1 | 2,
	userId: string
): Promise<ClientDocument> {
	// Validate file
	const validation = validateFile(file);
	if (!validation.valid) {
		throw new Error(validation.error);
	}

	// Create storage reference
	const fileExtension = file.name.split('.').pop() || 'jpg';
	const fileName = `image-${imageNumber}.${fileExtension}`;
	const storageRef = ref(storage, `client-documents/${clientId}/${fileName}`);

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
 * Delete a client document from Firebase Storage
 * @param clientId - The client's ID
 * @param imageNumber - Image number (1 or 2)
 */
export async function deleteClientDocument(
	clientId: string,
	imageNumber: 1 | 2
): Promise<void> {
	// We need to delete all possible extensions since we don't know which one was uploaded
	const extensions = ['jpg', 'jpeg', 'png', 'pdf'];

	for (const ext of extensions) {
		try {
			const fileName = `image-${imageNumber}.${ext}`;
			const storageRef = ref(storage, `client-documents/${clientId}/${fileName}`);
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
 * Delete all documents for a client
 * @param clientId - The client's ID
 */
export async function deleteAllClientDocuments(clientId: string): Promise<void> {
	// Delete both images
	await Promise.all([deleteClientDocument(clientId, 1), deleteClientDocument(clientId, 2)]);
}
