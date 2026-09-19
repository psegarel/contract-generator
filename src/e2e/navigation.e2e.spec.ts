import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
	test('should redirect unauthenticated users to the login page', async ({ page }) => {
		await page.goto('/');

		await expect(page).toHaveURL(/\/login\/?$/);
		await expect(page.getByText(/Welcome Back/i)).toBeVisible();
	});

	test('should navigate to the login page directly', async ({ page }) => {
		await page.goto('/login');

		await expect(page).toHaveURL(/\/login\/?$/);
		await expect(page.getByText(/Welcome Back/i)).toBeVisible();
	});

	test('should redirect to login when accessing protected route unauthenticated', async ({
		page
	}) => {
		await page.goto('/contracts/service-provision');

		// Should be redirected to login
		await expect(page).toHaveURL(/\/login/);
	});
});
