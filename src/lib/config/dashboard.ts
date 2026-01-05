/**
 * Dashboard configuration
 * Default date range for financial calculations
 */

/**
 * Get the default date range for the current year
 * Defaults to January 1st to December 31st of the current year
 */
export function getDefaultDateRange(): { startDate: string; endDate: string } {
	const currentYear = new Date().getFullYear();
	return {
		startDate: `${currentYear}-01-01`,
		endDate: `${currentYear}-12-31`
	};
}
