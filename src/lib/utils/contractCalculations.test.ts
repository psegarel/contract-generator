import { describe, it, expect } from 'vitest';
import { sumContracts, type Contract } from './contractCalculations';

describe('sumContracts', () => {
	it('returns 0 for empty array', () => {
		expect(sumContracts([])).toBe(0);
	});

	it('sums preTaxValue for event-planning contracts', () => {
		const contracts = [
			{ type: 'event-planning', contractData: { contractValueVND: 100 } },
			{ type: 'event-planning', contractData: { contractValueVND: 200 } }
		] as Contract[];
		expect(sumContracts(contracts)).toBe(300);
	});

	it('ignores non-event-planning contracts', () => {
		const contracts = [
			{ type: 'event-planning', contractData: { contractValueVND: 100 } },
			{ type: 'service', contractData: { contractValueVND: 200 } }
		] as Contract[];
		expect(sumContracts(contracts)).toBe(100);
	});

	it('handles missing contractValueVND (treats as 0)', () => {
		const contracts = [
			{ type: 'event-planning', contractData: {} }
		] as Contract[];
		expect(sumContracts(contracts)).toBe(0);
	});
});