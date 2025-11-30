# Contract Template Placeholders Reference

This document lists all available placeholders you can use in `static/contract-template.docx`.

## How to Use

1. Open `static/contract-template.docx` in Microsoft Word
2. Insert any of these placeholders where you want dynamic content
3. Format the document as desired (fonts, spacing, tables, etc.)
4. Save the file

## Available Placeholders

### Contract Information

- `{contractNumber}` - Auto-generated contract number (format: YYYYMMDD-INITIALS-XXX)

### Company Information (Party A)

- `{companyName}` - Company name
- `{companyAddressLine1}` - Address line 1 (e.g., "7th Floor")
- `{companyAddressLine2}` - Address line 2 (e.g., "60 Nguyen Van Thu")
- `{companyWard}` - Ward (e.g., "Tan Dinh Ward")
- `{companyCity}` - City (e.g., "Ho Chi Minh City")
- `{companyTaxCode}` - Company tax code
- `{companyRepresentative}` - Representative name
- `{companyFunction}` - Representative function/title
- `{companyRepresentativePhone}` - Representative phone number
- `{companyRepresentativeEmail}` - Representative email address

### Client Information (Party B)

- `{clientName}` - Client/Staff name
- `{clientEmail}` - Client email address
- `{clientAddress}` - Client address
- `{clientPhone}` - Client phone number
- `{clientIdDocument}` - Client ID card or passport number
- `{clientTaxId}` - Client tax ID (shows "N/A" if not provided)

### Bank Details

- `{bankName}` - Bank name
- `{accountNumber}` - Account number

### Event Details

- `{jobName}` - Job name/role in English (e.g., "MC", "Performer")
- `{jobNameVN}` - Job name/role in Vietnamese (auto-translated)
- `{eventName}` - Event/program name
- `{numberOfPerformances}` - Number of performances/programs
- `{eventLocation}` - Event location/venue
- `{firstPerformanceTime}` - Performance time
- `{jobContent}` - Job content/responsibilities in English (can be multi-line)
- `{jobContentVN}` - Job content/responsibilities in Vietnamese (auto-translated)

### Financial Information

- `{netFee}` - Net fee paid to staff (formatted as Vietnamese currency)
- `{taxRate}` - Tax rate percentage (e.g., "10")
- `{taxAmount}` - Calculated tax amount (formatted as Vietnamese currency)
- `{grossFee}` - Total gross fee including tax (formatted as Vietnamese currency)

### Contract Period

- `{startDate}` - Contract start date
- `{endDate}` - Contract end date

## Notes

- Currency values are automatically formatted with Vietnamese number formatting (e.g., "10.000.000")
- All placeholders must use curly braces: `{placeholderName}`
- Placeholders are case-sensitive
- **Auto-translation**: `jobName` and `jobContent` are automatically translated to Vietnamese using MyMemory API
- Translation happens when generating the contract (no API key required)
- You can format the template however you want - the placeholders will be replaced with actual values when generating the contract
