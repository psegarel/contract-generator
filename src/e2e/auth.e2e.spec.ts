import { test, expect } from '@playwright/test';

test.describe('Authentication UI', () => {
	test('should display login form correctly', async ({ page }) => {
		await page.goto('/login');
		
		const emailInput = page.getByLabel('Email address');
		const passwordInput = page.getByLabel('Password');
		const submitButton = page.getByRole('button', { name: 'Sign in' });
		
		await expect(emailInput).toBeVisible();
		await expect(passwordInput).toBeVisible();
		await expect(submitButton).toBeVisible();
	});
});
