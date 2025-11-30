import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
	test('should load the landing page', async ({ page }) => {
		await page.goto('/');

		const heading = page.getByRole('heading', { level: 1 });
		await expect(heading).toContainText('Internal Contract');
	});

	test('should navigate to login page', async ({ page }) => {
		await page.goto('/');

		const loginLink = page.locator('a[href="/login"]');
		await expect(loginLink).toBeVisible();
		await loginLink.click();

		// Wait for navigation
		await expect(page).toHaveURL(/\/login\/?$/);

		const loginHeading = page.getByText(/Welcome Back/i);
		await expect(loginHeading).toBeVisible();
	});

	test('should redirect to login when accessing protected route unauthenticated', async ({
		page
	}) => {
		await page.goto('/service-contract');

		// Should be redirected to login
		await expect(page).toHaveURL(/\/login/);
	});
});
