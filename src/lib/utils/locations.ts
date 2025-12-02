import { LocationRepository } from './LocationRepository';
import type { Location, SavedLocation } from '$lib/types/location';

// Singleton instance for backward compatibility
const repository = new LocationRepository();

// Function exports - delegate to repository
export async function listLocations(): Promise<Array<{ id: string; name: string }>> {
	return repository.list();
}

export async function getLocation(id: string): Promise<SavedLocation | null> {
	return repository.getById(id);
}

export async function upsertLocation(
	ownerUid: string,
	data: Location,
	id?: string
): Promise<string> {
	return repository.upsert(ownerUid, data, id);
}

export async function deleteLocation(id: string): Promise<boolean> {
	return repository.delete(id);
}

// Re-export repository class and types
export { LocationRepository };
export type { Location, SavedLocation };
