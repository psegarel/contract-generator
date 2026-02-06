import type { BaseContract } from '$lib/types/v2';
import type { Payment } from '$lib/types/v2/payment';
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

/**
 * Filter payments by date range using dueDate.
 * All payments should have a dueDate set (migrated or set at creation).
 * Falls back to createdAt only for legacy payments without dueDate.
 */
function filterPaymentsByDateRange(
	payments: Payment[],
	startDate: string,
	endDate: string
): Payment[] {
	// Use UTC for both start and end to match payment timestamps (dueDate.toMillis() is UTC)
	// Start date: beginning of day in UTC (00:00:00.000Z)
	const start = new Date(startDate + 'T00:00:00.000Z').getTime();
	// End date: end of day in UTC (23:59:59.999Z)
	const end = new Date(endDate + 'T23:59:59.999Z').getTime();

	return payments.filter((payment) => {
		// Use dueDate for all payments; fallback to createdAt for legacy data
		const relevantDate = payment.dueDate
			? payment.dueDate.toMillis()
			: payment.createdAt.toMillis();

		return relevantDate >= start && relevantDate <= end;
	});
}

/**
 * Calculate dashboard statistics from payment records
 * This is the preferred method — derives stats from the payments collection.
 */
export function calculateDashboardStatsFromPayments(
	payments: Payment[],
	dateRange?: { startDate: string; endDate: string }
): DashboardStats {
	const range = dateRange || getDefaultDateRange();
	const filtered = filterPaymentsByDateRange(payments, range.startDate, range.endDate);

	// Total Received (net revenue) = receivable payments that are paid
	const netRevenue = filtered
		.filter((p) => p.direction === 'receivable' && p.status === 'paid')
		.reduce((sum, p) => sum + p.amount, 0);

	// Total Receivable = receivable payments still pending
	const totalReceivable = filtered
		.filter((p) => p.direction === 'receivable' && p.status === 'pending')
		.reduce((sum, p) => sum + p.amount, 0);

	// Total Payable = payable payments still pending
	const totalPayable = filtered
		.filter((p) => p.direction === 'payable' && p.status === 'pending')
		.reduce((sum, p) => sum + p.amount, 0);

	// Total Paid = payable payments that are paid
	const totalPaid = filtered
		.filter((p) => p.direction === 'payable' && p.status === 'paid')
		.reduce((sum, p) => sum + p.amount, 0);

	return {
		netRevenue,
		totalReceivable,
		totalPayable,
		totalPaid
	};
}

