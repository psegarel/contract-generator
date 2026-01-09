/**
 * Contract-related helper utilities
 * Includes contract number generation and other contract-specific operations
 */

/**
 * Generate a unique contract number based on client name and timestamp
 * Format: YYYYMMDD-INITIALS-XXX
 *
 * @param clientName - Client name to extract initials from
 * @param maxInitials - Maximum number of initials to include (default: no limit)
 * @returns Contract number in format: YYYYMMDD-INITIALS-XXX
 *
 * @example
 * generateContractNumber('Nguyen Van A') // "20260109-NVA-123"
 * generateContractNumber('Nguyen Van A', 3) // "20260109-NVA-123"
 * generateContractNumber('ABC Company Limited', 3) // "20260109-ACL-123"
 */
export function generateContractNumber(
	clientName: string,
	maxInitials?: number
): string {
	const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
	const initials = clientName
		.split(' ')
		.map((n) => n[0])
		.join('')
		.toUpperCase();
	const limitedInitials = maxInitials ? initials.slice(0, maxInitials) : initials;
	const timestamp = Date.now().toString().slice(-3);
	return `${dateStr}-${limitedInitials}-${timestamp}`;
}
