import type { BaseContract } from '$lib/types/v2';
import { getDefaultDateRange } from '$lib/config/dashboard';

export interface DashboardStats {
	netRevenue: number;
	totalReceivable: number;
	totalPayable: number;
	totalPaid: number;
}

/**
 * Filter contracts by date range based on createdAt timestamp
 * This matches what's shown in the contract list
 */
function filterByDateRange(
	contracts: BaseContract[],
	startDate: string,
	endDate: string
): BaseContract[] {
	const start = new Date(startDate).getTime();
	const end = new Date(endDate + 'T23:59:59.999Z').getTime(); // Include entire end date

	return contracts.filter((contract) => {
		const contractTime = contract.createdAt.toMillis();
		return contractTime >= start && contractTime <= end;
	});
}

/**
 * Calculate dashboard statistics from contracts
 * @param contracts - Array of all contracts (all types)
 * @param dateRange - Optional date range, defaults to current year (Jan 1 - Dec 31)
 * @returns Dashboard statistics
 */
export function calculateDashboardStats(
	contracts: BaseContract[],
	dateRange?: { startDate: string; endDate: string }
): DashboardStats {
	const range = dateRange || getDefaultDateRange();
	const filteredContracts = filterByDateRange(contracts, range.startDate, range.endDate);

	// Total Received = total of all receivable contracts (regardless of payment status)
	const netRevenue = filteredContracts
		.filter((c) => c.paymentDirection === 'receivable')
		.reduce((sum, c) => sum + c.contractValue, 0);

	// Total Receivable = total we're owed in contracts that haven't been paid yet
	const totalReceivable = filteredContracts
		.filter((c) => c.paymentDirection === 'receivable' && c.paymentStatus === 'unpaid')
		.reduce((sum, c) => sum + c.contractValue, 0);

	// Total Payable = total before tax of all contracts we need to pay that haven't been paid yet
	const totalPayable = filteredContracts
		.filter((c) => c.paymentDirection === 'payable' && c.paymentStatus === 'unpaid')
		.reduce((sum, c) => sum + c.contractValue, 0);

	// Total Paid = total of payable contracts that have been paid
	// This is the total amount we've actually paid out
	const totalPaid = filteredContracts
		.filter((c) => c.paymentDirection === 'payable' && c.paymentStatus === 'paid')
		.reduce((sum, c) => sum + c.contractValue, 0);

	return {
		netRevenue,
		totalReceivable,
		totalPayable,
		totalPaid
	};
}

