import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, PageSizes, StandardFonts, rgb, type PDFImage, type PDFPage } from 'pdf-lib';
import { companyConfig } from '$lib/config/company';
import type { Quotation, QuotationLineItem } from '$lib/types/v2';

const margin = 40;
const insenseLogoUrl = '/insense-logo.png';
const regularFontUrl = '/fonts/BeVietnamPro-Regular.ttf';
const boldFontUrl = '/fonts/BeVietnamPro-Bold.ttf';
const ink = rgb(0, 0, 0);
const muted = rgb(0.35, 0.35, 0.35);
const soft = rgb(0.96, 0.96, 0.96);

type Font = { widthOfTextAtSize(text: string, size: number): number };

function printable(value: string): string {
	return value.replace(/–|—/g, '-').replace(/×/g, 'x').replace(/[’‘]/g, "'");
}

function formatVnd(value: number): string {
	return `${value.toLocaleString('en-US')} VND`;
}

function drawText(
	page: PDFPage,
	text: string,
	x: number,
	y: number,
	size: number,
	font: Font,
	color = ink
) {
	page.drawText(printable(text), { x, y, size, font: font as never, color });
}

function drawRight(
	page: PDFPage,
	text: string,
	right: number,
	y: number,
	size: number,
	font: Font,
	color = ink
) {
	const value = printable(text);
	drawText(page, value, right - font.widthOfTextAtSize(value, size), y, size, font, color);
}

function truncate(text: string, font: Font, size: number, width: number): string {
	let result = printable(text);
	while (result.length > 4 && font.widthOfTextAtSize(result, size) > width) {
		result = `${result.slice(0, -5)}...`;
	}
	return result;
}

function wrapText(text: string, font: Font, size: number, width: number): string[] {
	const words = printable(text).trim().split(/\s+/).filter(Boolean);
	const lines: string[] = [];
	let line = '';

	for (const word of words) {
		const candidate = line ? `${line} ${word}` : word;
		if (line && font.widthOfTextAtSize(candidate, size) > width) {
			lines.push(line);
			line = word;
		} else {
			line = candidate;
		}
	}
	if (line) lines.push(line);
	return lines;
}

async function embedImage(
	pdf: PDFDocument,
	item: QuotationLineItem
): Promise<PDFImage | undefined> {
	if (!item.imageUrl) return undefined;
	try {
		const response = await fetch(item.imageUrl);
		if (!response.ok) return undefined;
		const bytes = new Uint8Array(await response.arrayBuffer());
		const contentType = (response.headers.get('content-type') ?? '').toLowerCase();
		const isPng = contentType.includes('png') || (bytes[0] === 0x89 && bytes[1] === 0x50);
		const isJpeg = contentType.includes('jpeg') || (bytes[0] === 0xff && bytes[1] === 0xd8);
		if (isPng) return await pdf.embedPng(bytes);
		if (isJpeg) return await pdf.embedJpg(bytes);
	} catch {
		// Missing or unsupported images should not prevent quotation download.
	}
	return undefined;
}

async function embedInsenseLogo(pdf: PDFDocument): Promise<PDFImage | undefined> {
	try {
		const response = await fetch(insenseLogoUrl);
		if (!response.ok) return undefined;
		return await pdf.embedPng(new Uint8Array(await response.arrayBuffer()));
	} catch {
		return undefined;
	}
}

async function embedTextFonts(pdf: PDFDocument): Promise<{ regular: Font; bold: Font }> {
	try {
		const [regularResponse, boldResponse] = await Promise.all([
			fetch(regularFontUrl),
			fetch(boldFontUrl)
		]);
		if (!regularResponse.ok || !boldResponse.ok) {
			throw new Error('Quotation fonts could not be loaded');
		}
		const [regularBytes, boldBytes] = await Promise.all([
			regularResponse.arrayBuffer(),
			boldResponse.arrayBuffer()
		]);
		pdf.registerFontkit(fontkit);
		const regular = await pdf.embedFont(new Uint8Array(regularBytes), { subset: true });
		const bold = await pdf.embedFont(new Uint8Array(boldBytes), { subset: true });
		return { regular, bold };
	} catch (error) {
		// The server-side PDF unit tests use ASCII fixtures and do not serve static font assets.
		if (typeof window === 'undefined') {
			return {
				regular: await pdf.embedFont(StandardFonts.Helvetica),
				bold: await pdf.embedFont(StandardFonts.HelveticaBold)
			};
		}
		throw error;
	}
}

function addPage(pdf: PDFDocument): PDFPage {
	return pdf.addPage(PageSizes.A4);
}

function drawFooter(page: PDFPage, pageNumber: number, regular: Font, showPageNumber: boolean) {
	const address = [
		companyConfig.addressLine1,
		companyConfig.addressLine2,
		companyConfig.ward,
		companyConfig.city
	]
		.filter(Boolean)
		.join(', ');
	const companyLine = `${companyConfig.name} | Tax code: ${companyConfig.taxCode}`;
	const contactLine = [
		address,
		companyConfig.representativePhone,
		companyConfig.representativeEmail
	]
		.filter(Boolean)
		.join(' | ');
	drawText(
		page,
		truncate(companyLine, regular, 6, PageSizes.A4[0] - margin * 2 - (showPageNumber ? 64 : 0)),
		margin,
		30,
		6,
		regular,
		muted
	);
	drawText(
		page,
		truncate(contactLine, regular, 6, PageSizes.A4[0] - margin * 2),
		margin,
		18,
		6,
		regular,
		muted
	);
	if (showPageNumber) {
		drawRight(page, `Page ${pageNumber}`, PageSizes.A4[0] - margin, 30, 7, regular, muted);
	}
}

function drawLabel(page: PDFPage, label: string, x: number, y: number, bold: Font): number {
	drawText(page, label.toUpperCase(), x, y, 8, bold, ink);
	return y - 18;
}

function drawSummaryRow(
	page: PDFPage,
	label: string,
	value: string,
	y: number,
	regular: Font,
	bold?: Font,
	size = 8,
	color = muted
) {
	drawText(page, label, margin + 12, y, size, regular, color);
	drawRight(page, value, PageSizes.A4[0] - margin - 12, y, size, bold ?? regular, color);
}

export async function generateQuotationPdf(quotation: Quotation): Promise<Uint8Array> {
	const pdf = await PDFDocument.create();
	const { regular, bold } = await embedTextFonts(pdf);
	const images = new Map<string, PDFImage | undefined>();
	const logo = await embedInsenseLogo(pdf);

	await Promise.all(
		quotation.lineItems.map(async (item) =>
			images.set(item.catalogItemId, await embedImage(pdf, item))
		)
	);

	let pageNumber = 1;
	let page = addPage(pdf);
	const [width, height] = PageSizes.A4;
	let y = height - 162;

	if (logo) {
		const dimensions = logo.scaleToFit(88, 88);
		page.drawImage(logo, {
			x: margin,
			y: height - 132 + (88 - dimensions.height) / 2,
			width: dimensions.width,
			height: dimensions.height
		});
	} else {
		drawText(page, 'Insense', margin, height - 96, 21, bold);
	}
	drawRight(page, 'QUOTATION', width - margin, height - 57, 21, bold);
	drawRight(page, quotation.quotationNumber, width - margin, height - 80, 9, regular, muted);

	const columnWidth = (width - margin * 2 - 24) / 2;
	let customerY = drawLabel(page, 'Prepared for', margin, y, bold);
	drawText(
		page,
		quotation.customer.companyName || quotation.customer.name,
		margin,
		customerY,
		10,
		bold
	);
	customerY -= 13;
	if (quotation.customer.companyName) {
		drawText(page, quotation.customer.name, margin, customerY, 8, regular, muted);
		customerY -= 12;
	}
	for (const line of [
		quotation.customer.email,
		quotation.customer.phone,
		quotation.customer.address
	]) {
		if (line) {
			drawText(page, line, margin, customerY, 8, regular, muted);
			customerY -= 11;
		}
	}

	let detailsY = drawLabel(page, 'Quotation details', margin + columnWidth + 24, y, bold);
	drawText(
		page,
		`Issued: ${new Date().toLocaleDateString('en-GB')}`,
		margin + columnWidth + 24,
		detailsY,
		8,
		regular
	);
	detailsY -= 14;
	drawText(
		page,
		`Valid until: ${quotation.validUntil}`,
		margin + columnWidth + 24,
		detailsY,
		8,
		regular
	);
	detailsY -= 14;
	if (quotation.eventName) {
		drawText(
			page,
			`Event: ${quotation.eventName}`,
			margin + columnWidth + 24,
			detailsY,
			8,
			regular
		);
		detailsY -= 14;
	}
	if (quotation.venue)
		drawText(page, `Venue: ${quotation.venue}`, margin + columnWidth + 24, detailsY, 8, regular);

	y = Math.min(customerY, detailsY) - 28;
	drawText(page, 'EQUIPMENT', margin, y, 11, bold, ink);
	y -= 18;
	drawText(page, 'ITEM', margin + 54, y - 9, 8, bold, ink);
	drawText(page, 'QTY', width - margin - 190, y - 9, 8, bold, ink);
	drawRight(page, 'UNIT PRICE', width - margin - 80, y - 9, 8, bold, ink);
	drawRight(page, 'TOTAL', width - margin - 8, y - 9, 8, bold, ink);
	y -= 34;

	for (const item of quotation.lineItems) {
		if (y < 92) {
			drawFooter(page, pageNumber, regular, true);
			page = addPage(pdf);
			pageNumber += 1;
			y = height - 54;
			drawText(page, quotation.quotationNumber, margin, y, 10, bold);
			drawRight(page, 'EQUIPMENT', width - margin, y, 11, bold, muted);
			y -= 28;
		}

		const rowHeight = 48;
		const image = images.get(item.catalogItemId);
		if (image) {
			const dimensions = image.scaleToFit(40, 36);
			page.drawImage(image, {
				x: margin + 5 + (40 - dimensions.width) / 2,
				y: y - 31 + (36 - dimensions.height) / 2,
				width: dimensions.width,
				height: dimensions.height
			});
		} else {
			page.drawRectangle({ x: margin + 5, y: y - 30, width: 40, height: 32, color: soft });
			drawText(page, 'AV', margin + 16, y - 14, 8, bold, muted);
		}
		drawText(page, truncate(item.name, regular, 9, 190), margin + 54, y - 12, 9, regular);
		if (item.manufacturer)
			drawText(
				page,
				truncate(item.manufacturer, regular, 7, 190),
				margin + 54,
				y - 25,
				7,
				regular,
				muted
			);
		drawText(page, String(item.quantity), width - margin - 190, y - 16, 9, regular);
		drawRight(page, formatVnd(item.unitPriceVnd), width - margin - 80, y - 16, 8, regular);
		drawRight(
			page,
			formatVnd(item.quantity * item.unitPriceVnd),
			width - margin - 8,
			y - 16,
			8,
			regular
		);
		y -= rowHeight;
	}

	y -= 16;
	const includesVat = quotation.vatRatePercent != null;
	const summaryBottomOffset = includesVat ? 110 : 96;
	let summaryBottom = y - summaryBottomOffset;
	if (summaryBottom < 100) {
		drawFooter(page, pageNumber, regular, true);
		page = addPage(pdf);
		pageNumber += 1;
		y = height - 54;
		drawText(page, quotation.quotationNumber, margin, y, 10, bold);
		drawRight(page, 'SUMMARY', width - margin, y, 11, bold, muted);
		y -= 40;
		summaryBottom = y - summaryBottomOffset;
	}
	drawSummaryRow(
		page,
		'Equipment subtotal',
		formatVnd(quotation.equipmentSubtotalVnd),
		y - 18,
		regular
	);
	drawSummaryRow(
		page,
		`Discount (${quotation.equipmentDiscountPercent}%)`,
		`- ${formatVnd(quotation.equipmentDiscountVnd)}`,
		y - 32,
		regular
	);
	drawSummaryRow(page, 'Transport', formatVnd(quotation.transportVnd), y - 46, regular);
	drawSummaryRow(page, 'Handling', formatVnd(quotation.handlingVnd), y - 60, regular);
	if (includesVat) {
		drawSummaryRow(
			page,
			`VAT (${quotation.vatRatePercent}%)`,
			formatVnd(quotation.vatAmountVnd ?? 0),
			y - 74,
			regular
		);
	}
	drawSummaryRow(
		page,
		includesVat ? 'TOTAL INCLUDING VAT' : 'TOTAL',
		formatVnd(quotation.totalVnd),
		y - (includesVat ? 98 : 84),
		regular,
		bold,
		12,
		ink
	);

	if (quotation.notes?.trim()) {
		const noteSize = 8;
		const noteLines = wrapText(quotation.notes, regular, noteSize, width - margin * 2);
		const notesFirstBaseline = 48 + (noteLines.length - 1) * 10;
		const notesHeadingY = notesFirstBaseline + 15;
		if (summaryBottom < notesHeadingY + 18) {
			drawFooter(page, pageNumber, regular, true);
			page = addPage(pdf);
			pageNumber += 1;
		}
		drawText(page, 'NOTES AND TERMS', margin, notesHeadingY, 7, bold, muted);
		noteLines.forEach((line, index) => {
			drawText(page, line, margin, notesFirstBaseline - index * 10, noteSize, regular, muted);
		});
	}

	drawFooter(page, pageNumber, regular, pdf.getPageCount() > 1);
	return pdf.save();
}
