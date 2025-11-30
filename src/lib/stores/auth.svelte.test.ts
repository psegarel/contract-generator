import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthStore } from './auth.svelte';
import { onAuthStateChanged } from 'firebase/auth';

// Mock firebase/auth
vi.mock('firebase/auth', () => ({
	onAuthStateChanged: vi.fn(),
	getAuth: vi.fn()
}));

// Mock the firebase config
vi.mock('$lib/config/firebase', () => ({
	auth: {}
}));

describe('AuthStore', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should initialize with default values', () => {
		const store = new AuthStore();

		// It should be loading initially
		// Since onAuthStateChanged is mocked, the callback isn't called immediately
		expect(store.loading).toBe(true);
		expect(store.user).toBe(null);
		expect(store.isAuthenticated).toBe(false);
	});

	it('should update state when user logs in', () => {
		const store = new AuthStore();

		const mockOnAuthStateChanged = onAuthStateChanged as unknown as ReturnType<typeof vi.fn>;

		// Expect listener to be attached
		expect(mockOnAuthStateChanged).toHaveBeenCalled();
		// The last call should be for this instance
		const callback =
			mockOnAuthStateChanged.mock.calls[mockOnAuthStateChanged.mock.calls.length - 1][1];

		const mockUser = { uid: '123', email: 'test@example.com' };

		// Simulate login
		callback(mockUser);

		expect(store.user).toEqual(mockUser);
		expect(store.isAuthenticated).toBe(true);
		expect(store.loading).toBe(false);
		expect(store.initialized).toBe(true);
	});

	it('should update state when user logs out', () => {
		const store = new AuthStore();

		const mockOnAuthStateChanged = onAuthStateChanged as unknown as ReturnType<typeof vi.fn>;
		const callback =
			mockOnAuthStateChanged.mock.calls[mockOnAuthStateChanged.mock.calls.length - 1][1];

		// Simulate logout
		callback(null);

		expect(store.user).toBe(null);
		expect(store.isAuthenticated).toBe(false);
		expect(store.loading).toBe(false);
	});
});
