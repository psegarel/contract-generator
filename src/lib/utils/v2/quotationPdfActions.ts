import type { Quotation } from '$lib/types/v2';
import { generateQuotationPdf } from './quotationPdfGenerator';

export async function downloadQuotationPdf(quotation: Quotation): Promise<void> {
	const bytes = await generateQuotationPdf(quotation);
	const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = `${quotation.quotationNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	URL.revokeObjectURL(url);
}
