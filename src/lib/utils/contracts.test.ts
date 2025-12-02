import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllContracts, saveContract } from './contracts';
import * as firestore from 'firebase/firestore';

// Mock Firebase Firestore
vi.mock('firebase/firestore', async () => {
	const actual = await vi.importActual('firebase/firestore');
	return {
		...actual,
		collection: vi.fn(),
		query: vi.fn(),
		where: vi.fn(),
		orderBy: vi.fn(),
		getDocs: vi.fn(),
		addDoc: vi.fn(),
		getDoc: vi.fn(),
		doc: vi.fn(),
		updateDoc: vi.fn(),
		serverTimestamp: vi.fn(() => ({ _methodName: 'serverTimestamp' }))
	};
});

vi.mock('$lib/config/firebase', () => ({
	db: { _type: 'firestore' }
}));

describe('contracts utility functions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getAllContracts', () => {
		it('should query Firestore with correct parameters', async () => {
			// Arrange
			const mockUserId = 'user-123';
			const mockQuerySnapshot = {
				docs: [
					{
						id: 'contract-1',
						data: () => ({
							type: 'service',
							contractNumber: 'NUM-001',
							contractData: { clientName: 'Test Client' },
							ownerUid: mockUserId,
							createdAt: { toDate: () => new Date() }
						})
					}
				]
			};

			vi.mocked(firestore.getDocs).mockResolvedValue(mockQuerySnapshot as any);
			vi.mocked(firestore.collection).mockReturnValue('mockCollection' as any);
			vi.mocked(firestore.query).mockReturnValue('mockQuery' as any);
			vi.mocked(firestore.orderBy).mockReturnValue('mockOrderBy' as any);

			// Act
			const result = await getAllContracts();

			// Assert - Check that query was called with correct parameters
			expect(firestore.collection).toHaveBeenCalled();
			expect(firestore.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
			expect(firestore.getDocs).toHaveBeenCalled();

			// Verify result structure
			expect(result).toHaveLength(1);
			expect(result[0]).toMatchObject({
				id: 'contract-1',
				type: 'service',
				contractNumber: 'NUM-001'
			});
		});

		it('should return empty array when no contracts exist', async () => {
			// Arrange
			const mockQuerySnapshot = { docs: [] };
			vi.mocked(firestore.getDocs).mockResolvedValue(mockQuerySnapshot as any);
			vi.mocked(firestore.collection).mockReturnValue('mockCollection' as any);
			vi.mocked(firestore.query).mockReturnValue('mockQuery' as any);
			vi.mocked(firestore.orderBy).mockReturnValue('mockOrderBy' as any);

			// Act
			const result = await getAllContracts();

			// Assert
			expect(result).toEqual([]);
		});

		it('should throw error when Firestore query fails', async () => {
			// Arrange
			vi.mocked(firestore.getDocs).mockRejectedValue(new Error('Firestore error'));
			vi.mocked(firestore.collection).mockReturnValue('mockCollection' as any);
			vi.mocked(firestore.query).mockReturnValue('mockQuery' as any);
			vi.mocked(firestore.orderBy).mockReturnValue('mockOrderBy' as any);

			// Act & Assert
			await expect(getAllContracts()).rejects.toThrow('Failed to fetch contracts');
		});
	});

	describe('saveContract', () => {
		it('should save contract with all required fields', async () => {
			// Arrange
			const mockContractData = {
				clientName: 'Test Client',
				clientEmail: 'test@example.com',
				clientAddress: '123 Test St',
				clientPhone: '555-0100',
				clientIdDocument: 'ID123',
				clientTaxId: 'TAX123',
				jobName: 'Test Job',
				eventName: 'Test Event',
				numberOfPerformances: 1,
				eventLocation: 'Test Location',
				firstPerformanceTime: '7:00 PM',
				jobContent: 'Test content',
				bankName: 'Test Bank',
				accountNumber: '123456',
				netFee: 1000000,
				taxRate: 10,
				startDate: '2024-12-01',
				endDate: '2024-12-01'
			};

			vi.mocked(firestore.addDoc).mockResolvedValue({ id: 'new-contract-id' } as any);
			vi.mocked(firestore.collection).mockReturnValue('mockCollection' as any);

			// Act
			const result = await saveContract('user-123', 'service', mockContractData, 'NUM-001');

			// Assert
			expect(firestore.addDoc).toHaveBeenCalled();
			expect(result).toBe('new-contract-id');

			// Verify the contract data includes all required fields
			const savedData = vi.mocked(firestore.addDoc).mock.calls[0][1];
			expect(savedData).toMatchObject({
				type: 'service',
				contractData: mockContractData,
				contractNumber: 'NUM-001',
				ownerUid: 'user-123'
			});
			expect(savedData).toHaveProperty('createdAt');
		});
	});
});
