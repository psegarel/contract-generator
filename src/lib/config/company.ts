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
 * - VITE_DEFAULT_PERFORMER_PIT_RATE - Default PIT rate for performers when no explicit rate is set
 * - VITE_DEFAULT_PERFORMER_PIT_RATE_POLICY - Default performer PIT policy key for new performers
 * - VITE_PERFORMER_PIT_RATE_POLICIES - Comma-separated mapping of performer PIT policy keys to numeric rates
 * - VITE_EQUIPMENT_RENTAL_TAX_RATE - Default tax rate for equipment rental contracts (default: 8)
 *
 * Note: taxRates array is for Service Provision contracts (10, 20 for individuals; 8 for companies)
 */

const parseRatePolicies = (value?: string) => {
	if (!value) return {} as Record<string, number>;

	return Object.fromEntries(
		value
			.split(',')
			.map((entry) => entry.trim())
			.map((entry) => {
				const [key, rawRate] = entry.split(':').map((part) => part.trim());
				const rate = Number(rawRate);
				if (!key || Number.isNaN(rate)) return null;
				return [key, rate] as const;
			})
			.filter((item): item is readonly [string, number] => item !== null)
	);
};

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
	defaultPerformerPitRate: Number(import.meta.env.VITE_DEFAULT_PERFORMER_PIT_RATE) || 10,
	defaultPerformerPitRatePolicy: import.meta.env.VITE_DEFAULT_PERFORMER_PIT_RATE_POLICY || 'standard',
	performerPitRatePolicies: parseRatePolicies(import.meta.env.VITE_PERFORMER_PIT_RATE_POLICIES),
};
