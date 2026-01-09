/**
 * Shared formatting utilities for dates, currency, and other display values
 * Used across components to avoid duplication
 */

/**
 * Format a date string to a human-readable format (English, short)
 * @param dateString - ISO date string or date-like string
 * @returns Formatted date (e.g., "JAN 15, 2024")
 * @example formatDateString('2024-01-15') // "JAN 15, 2024"
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
 * Format a date string in Vietnamese format
 * @param dateString - ISO date string or date-like string
 * @returns Formatted date (e.g., "16 tháng 8 năm 2025")
 * @example formatDateVietnamese('2025-08-16') // "16 tháng 8 năm 2025"
 */
export function formatDateVietnamese(dateString: string): string {
	const date = new Date(dateString);
	const day = date.getDate();
	const month = date.getMonth() + 1;
	const year = date.getFullYear();
	return `${day} tháng ${month} năm ${year}`;
}

/**
 * Format a date string in English format (long)
 * @param dateString - ISO date string or date-like string
 * @returns Formatted date (e.g., "16 August 2025")
 * @example formatDateEnglish('2025-08-16') // "16 August 2025"
 */
export function formatDateEnglish(dateString: string): string {
	const date = new Date(dateString);
	const day = date.getDate();
	const month = date.toLocaleString('en-US', { month: 'long' });
	const year = date.getFullYear();
	return `${day} ${month} ${year}`;
}

/**
 * Format a number as Vietnamese Dong currency
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "₫1,000,000")
 * @example formatCurrency(1000000) // "₫1,000,000"
 */
export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat('vi-VN', {
		style: 'currency',
		currency: 'VND'
	}).format(amount);
}
