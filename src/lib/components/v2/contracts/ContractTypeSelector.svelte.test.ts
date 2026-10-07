import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ContractTypeSelector from './ContractTypeSelector.svelte';

describe('ContractTypeSelector', () => {
	it('offers only contract types with implemented creation routes', async () => {
		const onSelect = vi.fn();
		render(ContractTypeSelector, { props: { onSelect } });

		for (const name of [
			'Equipment Rental',
			'Equipment Rental (One-Off)',
			'Service Provision',
			'Event Planning',
			'DJ Residency'
		]) {
			await expect.element(page.getByRole('heading', { name, exact: true })).toBeInTheDocument();
		}

		for (const name of ['Venue Rental', 'Performer Booking', 'Subcontractor', 'Client Service']) {
			await expect
				.element(page.getByRole('heading', { name, exact: true }))
				.not.toBeInTheDocument();
		}

		await page.getByRole('button', { name: /Service Provision/ }).click();
		expect(onSelect).toHaveBeenCalledWith('service-provision');
	});
});
