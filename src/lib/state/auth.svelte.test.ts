import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthState } from './auth.svelte';
import { onAuthStateChanged } from 'firebase/auth';

// Mock firebase/auth
vi.mock('firebase/auth', () => ({
	onAuthStateChanged: vi.fn(),
	getAuth: vi.fn()
}));

// Mock the firebase config with the same exports the app uses
vi.mock('$lib/config/firebase', () => ({
	auth: {},
	db: {},
	storage: {}
}));

vi.mock('$lib/utils/UserRepository', () => ({
	UserRepository: class {
		async getProfile() {
			return null;
		}

		async createProfile() {
			return;
		}
	}
}));

describe('AuthState', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should initialize with default values', () => {
		const state = new AuthState();

		// It should be loading initially
		// Since onAuthStateChanged is mocked, the callback isn't called immediately
		expect(state.loading).toBe(true);
		expect(state.user).toBe(null);
		expect(state.isAuthenticated).toBe(false);
	});

	it('should update state when user logs in', async () => {
		const state = new AuthState();

		const mockOnAuthStateChanged = onAuthStateChanged as unknown as ReturnType<typeof vi.fn>;

		// Expect listener to be attached
		expect(mockOnAuthStateChanged).toHaveBeenCalled();
		// The last call should be for this instance
		const callback =
			mockOnAuthStateChanged.mock.calls[mockOnAuthStateChanged.mock.calls.length - 1][1];

		const mockUser = { uid: '123', email: 'test@example.com' };

		// Simulate login
		await callback(mockUser);

		expect(state.user).toEqual(mockUser);
		expect(state.isAuthenticated).toBe(true);
		expect(state.loading).toBe(false);
		expect(state.initialized).toBe(true);
	});

	it('should update state when user logs out', async () => {
		const state = new AuthState();

		const mockOnAuthStateChanged = onAuthStateChanged as unknown as ReturnType<typeof vi.fn>;
		const callback =
			mockOnAuthStateChanged.mock.calls[mockOnAuthStateChanged.mock.calls.length - 1][1];

		// Simulate logout
		await callback(null);

		expect(state.user).toBe(null);
		expect(state.isAuthenticated).toBe(false);
		expect(state.loading).toBe(false);
	});
});
