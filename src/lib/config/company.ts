/**
 * Company configuration (Party A information)
 * 
 * Reads from environment variables with fallbacks to default values.
 * This allows Party A (our company) information to be configured via env vars
 * while maintaining backward compatibility with hardcoded defaults.
 * 
 * Environment Variables (all optional, with fallbacks):
 * - VITE_COMPANY_NAME - Company name in English
 * - VITE_COMPANY_NAME_VIETNAMESE - Company name in Vietnamese
 * - VITE_COMPANY_ADDRESS_LINE1 - Address line 1
 * - VITE_COMPANY_ADDRESS_LINE2 - Address line 2
 * - VITE_COMPANY_WARD - Ward/district
 * - VITE_COMPANY_CITY - City name
 * - VITE_COMPANY_TAX_CODE - Company tax identification number
 * - VITE_COMPANY_REPRESENTATIVE - Representative name
 * - VITE_COMPANY_REPRESENTATIVE_PHONE - Representative phone number
 * - VITE_COMPANY_REPRESENTATIVE_EMAIL - Representative email address
 * - VITE_COMPANY_BANK_NAME - Company bank name (e.g., "ACB")
 * - VITE_COMPANY_BANK_ACCOUNT_NUMBER - Company bank account number
 * - VITE_EQUIPMENT_RENTAL_TAX_RATE - Default tax rate for equipment rental contracts (default: 8)
 * 
 * Note: taxRates array is for Service Provision contracts (10, 20 for individuals; 8 for companies)
 */
export const companyConfig = {
	name: import.meta.env.VITE_COMPANY_NAME || 'INSENSE COMPANY LIMITED',
	nameVietnamese: import.meta.env.VITE_COMPANY_NAME_VIETNAMESE || 'CÔNG TY TNHH INSENSE',
	addressLine1: import.meta.env.VITE_COMPANY_ADDRESS_LINE1 || '7th Floor',
	addressLine2: import.meta.env.VITE_COMPANY_ADDRESS_LINE2 || '60 Nguyen Van Thu',
	ward: import.meta.env.VITE_COMPANY_WARD || 'Tan Dinh Ward',
	city: import.meta.env.VITE_COMPANY_CITY || 'Ho Chi Minh City',
	taxCode: import.meta.env.VITE_COMPANY_TAX_CODE || '0108958239',
	representative: import.meta.env.VITE_COMPANY_REPRESENTATIVE || 'Mr. Patrick Segarel',
	representativePhone: import.meta.env.VITE_COMPANY_REPRESENTATIVE_PHONE || '+84 (0) 37 7920 759',
	representativeEmail: import.meta.env.VITE_COMPANY_REPRESENTATIVE_EMAIL || 'patrick@insense.vn',
	bankName: import.meta.env.VITE_COMPANY_BANK_NAME || '',
	bankAccountNumber: import.meta.env.VITE_COMPANY_BANK_ACCOUNT_NUMBER || '',
	taxRates: [10, 20], // Service Provision contract tax rates (for individuals: 10, 20; for companies: 8)
	equipmentRentalTaxRate: Number(import.meta.env.VITE_EQUIPMENT_RENTAL_TAX_RATE) || 8 // Default tax rate for equipment rental contracts
};
