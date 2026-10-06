import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import type { QuotationPackageCatalogueItem } from '$lib/types/v2';
import QuotationForm from './QuotationForm.svelte';
import { saveQuotation } from '$lib/utils/v2/quotations';

vi.mock('$lib/utils/v2/appConfig', () => ({
	getQuotationSettings: vi.fn().mockResolvedValue({ defaultVatRatePercent: 8 })
}));

vi.mock('$lib/utils/v2/leads', () => ({ saveLead: vi.fn() }));

vi.mock('$lib/utils/v2/quotations', () => ({
	saveQuotation: vi.fn(),
	updateQuotation: vi.fn()
}));

describe('QuotationForm equipment picker', () => {
	it('explains when the connected API has not been updated to return packages', async () => {
		render(QuotationForm, {
			props: {
				clients: [],
				catalogueItems: [],
				cataloguePackages: [],
				catalogueSupportsPackages: false,
				catalogueError: null
			}
		});

		await expect
			.element(page.getByText(/Deploy the latest Insense Packages API/))
			.toBeInTheDocument();
	});

	it('stays open while editing selection and applies quantities with filled images', async () => {
		render(QuotationForm, {
			props: {
				clients: [],
				cataloguePackages: [],
				catalogueSupportsPackages: true,
				catalogueError: null,
				catalogueItems: [
					{
						id: 'l-acoustics-x12',
						name: 'L-Acoustics X12',
						description: 'Two-way coaxial speaker',
						category: 'audio',
						manufacturer: 'L-Acoustics',
						rentalRateVnd: 1200000,
						imageUrl: 'https://example.com/x12.jpg',
						outsourced: false
					}
				]
			}
		});

		await page.getByRole('button', { name: 'Select Equipment' }).click();

		const dialog = page.getByRole('dialog').element() as HTMLDialogElement;
		expect(dialog.open).toBe(true);
		expect(dialog.closest('form')).toBeNull();
		await expect
			.element(page.getByRole('img', { name: 'L-Acoustics X12' }))
			.toHaveClass(/object-cover/);

		await page.getByRole('checkbox', { name: 'Select L-Acoustics X12' }).click();
		const quantity = page.getByRole('spinbutton', { name: 'Quantity for L-Acoustics X12' });
		await quantity.fill('3');

		expect(dialog.open).toBe(true);

		await page.getByRole('button', { name: 'Apply Selection' }).click();
		expect(dialog.open).toBe(false);
		await expect
			.element(page.getByRole('spinbutton', { name: 'Quantity for L-Acoustics X12' }))
			.toHaveValue(3);
	});

	it('opens package details and saves a package-only quotation at the selected guest count', async () => {
		const cataloguePackage: QuotationPackageCatalogueItem = {
			slug: 'essential',
			name: 'Essential',
			tagline: 'A clear sound setup',
			description: 'For small events',
			guestRange: { min: 50, max: 100 },
			priceRange: { minVND: 10_000_000, maxVND: 15_000_000, currency: 'VND' },
			equipment: [
				{
					name: 'L-Acoustics X8',
					category: 'audio',
					quantity: 2,
					outsourced: false,
					manufacturer: 'L-Acoustics',
					imageUrl: null,
					note: null
				}
			],
			crew: [{ label: 'AV Technician', count: 1 }],
			highlights: []
		};
		vi.mocked(saveQuotation).mockResolvedValue('quotation-1');

		render(QuotationForm, {
			props: {
				clients: [
					{
						id: 'client-1',
						name: 'Alex Example',
						companyName: 'Example Events'
					} as never
				],
				catalogueItems: [],
				cataloguePackages: [cataloguePackage],
				catalogueSupportsPackages: true,
				catalogueError: null
			}
		});

		await page.getByLabelText('Client').selectOptions('client-1');
		await page.getByRole('button', { name: 'Select a package' }).click();
		const packageDialog = page.getByRole('dialog', { name: 'Select a package' });
		const packageDialogElement = packageDialog.element() as HTMLDialogElement;
		await page.getByRole('button', { name: /Essential/ }).click();
		await expect.element(page.getByText('2 × L-Acoustics X8')).toBeInTheDocument();
		const imagePlaceholder = page.getByTestId('package-image-placeholder');
		await expect.element(imagePlaceholder).toHaveClass(/bg-neutral-900/);
		await expect.element(imagePlaceholder).toHaveTextContent('');
		await packageDialog.getByRole('button', { name: 'Select this package' }).click();
		expect(packageDialogElement.open).toBe(false);
		await page.getByLabelText('Expected guests').fill('75');
		await page.getByRole('button', { name: 'Save quotation' }).click();

		expect(vi.mocked(saveQuotation)).toHaveBeenCalledWith(
			expect.objectContaining({
				lineItems: [],
				packageSnapshot: expect.objectContaining({
					slug: 'essential',
					expectedGuests: 75,
					quotedPriceVnd: 12_500_000
				})
			})
		);
	});
});
