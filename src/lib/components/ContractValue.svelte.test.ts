import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import ContractValue from './ContractValue.svelte';

describe('Card Component', () => {
	it('renders title and formatted value', () => {
		render(ContractValue, { totalContractValue: 1000000, title: 'Test Title' });
		expect(screen.getByRole('heading', { name: 'Test Title' })).toBeDefined();
		// Match currency format (approximate check for "1.000.000")
		expect(screen.getByText(/1\.000\.000/)).toBeDefined();
	});

	it('renders loading state', () => {
		const { container } = render(ContractValue, { totalContractValue: 0, isLoading: true });
		// Check for the animate-pulse class
		expect(container.querySelector('.animate-pulse')).toBeDefined();
	});

	it('renders error state', () => {
		render(ContractValue, { totalContractValue: 0, error: 'Test Error' });
		expect(screen.getByText('Error: Test Error')).toBeDefined();
	});
});
