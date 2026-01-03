/**
 * Shared formatting utilities for dates, currency, and other display values
 * Used across components to avoid duplication
 */

/**
 * Format a date string to a human-readable format
 * @param dateString - ISO date string or date-like string
 * @returns Formatted date (e.g., "JAN 15, 2024")
 */
export function formatDateString(dateString: string): string {
	if (!dateString) return 'N/A';
	const date = new Date(dateString);
	return new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	}).format(date);
}

/**
 * Format a number as Vietnamese Dong currency
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "₫1,000,000")
 */
export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat('vi-VN', {
		style: 'currency',
		currency: 'VND'
	}).format(amount);
}
