import { PDFDocument, PageSizes, StandardFonts, rgb, type PDFImage, type PDFPage } from 'pdf-lib';
import type { Quotation, QuotationLineItem } from '$lib/types/v2';

const margin = 40;
const ink = rgb(0.08, 0.1, 0.13);
const muted = rgb(0.38, 0.42, 0.47);
const accent = rgb(0.08, 0.32, 0.45);
const soft = rgb(0.94, 0.96, 0.97);
const border = rgb(0.82, 0.85, 0.87);

type Font = { widthOfTextAtSize(text: string, size: number): number };

function printable(value: string): string {
	return value
		.replace(/–|—/g, '-')
		.replace(/×/g, 'x')
		.replace(/[’‘]/g, "'")
		.replace(/[^\x20-\x7e]/g, '');
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

function addPage(pdf: PDFDocument): PDFPage {
	return pdf.addPage(PageSizes.A4);
}

function drawFooter(page: PDFPage, pageNumber: number, regular: Font) {
	const [, height] = PageSizes.A4;
	page.drawLine({
		start: { x: margin, y: 32 },
		end: { x: PageSizes.A4[0] - margin, y: 32 },
		thickness: 0.6,
		color: border
	});
	drawText(page, 'INSENSE AUDIO-VISUAL', margin, 20, 7, regular, muted);
	drawRight(page, `Page ${pageNumber}`, PageSizes.A4[0] - margin, 20, 7, regular, muted);
	void height;
}

function drawLabel(page: PDFPage, label: string, x: number, y: number, bold: Font): number {
	drawText(page, label.toUpperCase(), x, y, 7, bold, muted);
	return y - 16;
}

function drawSummaryRow(
	page: PDFPage,
	label: string,
	value: string,
	y: number,
	regular: Font,
	bold?: Font
) {
	drawText(page, label, margin + 12, y, 9, regular, muted);
	drawRight(page, value, PageSizes.A4[0] - margin - 12, y, 9, bold ?? regular);
}

export async function generateQuotationPdf(quotation: Quotation): Promise<Uint8Array> {
	const pdf = await PDFDocument.create();
	const regular = await pdf.embedFont(StandardFonts.Helvetica);
	const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
	const images = new Map<string, PDFImage | undefined>();

	await Promise.all(
		quotation.lineItems.map(async (item) =>
			images.set(item.catalogItemId, await embedImage(pdf, item))
		)
	);

	let pageNumber = 1;
	let page = addPage(pdf);
	const [width, height] = PageSizes.A4;
	let y = height - 48;

	drawText(page, 'INSENSE', margin, y, 24, bold, accent);
	drawText(page, 'AUDIO-VISUAL', margin, y - 14, 7, bold, muted);
	drawRight(page, 'QUOTATION', width - margin, y - 2, 20, bold);
	drawRight(page, quotation.quotationNumber, width - margin, y - 23, 9, regular, muted);
	y -= 66;
	page.drawLine({
		start: { x: margin, y },
		end: { x: width - margin, y },
		thickness: 1,
		color: accent
	});
	y -= 28;

	const columnWidth = (width - margin * 2 - 24) / 2;
	let customerY = drawLabel(page, 'Prepared for', margin, y, bold);
	drawText(
		page,
		quotation.customer.companyName || quotation.customer.name,
		margin,
		customerY,
		13,
		bold
	);
	customerY -= 16;
	if (quotation.customer.companyName) {
		drawText(page, quotation.customer.name, margin, customerY, 9, regular, muted);
		customerY -= 14;
	}
	for (const line of [
		quotation.customer.email,
		quotation.customer.phone,
		quotation.customer.address
	]) {
		if (line) {
			drawText(page, line, margin, customerY, 9, regular, muted);
			customerY -= 13;
		}
	}

	let detailsY = drawLabel(page, 'Quotation details', margin + columnWidth + 24, y, bold);
	drawText(
		page,
		`Issued: ${new Date().toLocaleDateString('en-GB')}`,
		margin + columnWidth + 24,
		detailsY,
		9,
		regular
	);
	detailsY -= 14;
	drawText(
		page,
		`Valid until: ${quotation.validUntil}`,
		margin + columnWidth + 24,
		detailsY,
		9,
		regular
	);
	detailsY -= 14;
	if (quotation.eventName) {
		drawText(
			page,
			`Event: ${quotation.eventName}`,
			margin + columnWidth + 24,
			detailsY,
			9,
			regular
		);
		detailsY -= 14;
	}
	if (quotation.venue)
		drawText(page, `Venue: ${quotation.venue}`, margin + columnWidth + 24, detailsY, 9, regular);

	y = Math.min(customerY, detailsY) - 28;
	drawText(page, 'EQUIPMENT', margin, y, 10, bold, accent);
	y -= 18;
	page.drawRectangle({ x: margin, y: y - 18, width: width - margin * 2, height: 24, color: soft });
	drawText(page, 'ITEM', margin + 54, y - 9, 7, bold, muted);
	drawText(page, 'QTY', width - margin - 190, y - 9, 7, bold, muted);
	drawRight(page, 'UNIT PRICE', width - margin - 80, y - 9, 7, bold, muted);
	drawRight(page, 'TOTAL', width - margin - 8, y - 9, 7, bold, muted);
	y -= 34;

	for (const item of quotation.lineItems) {
		if (y < 92) {
			drawFooter(page, pageNumber, regular);
			page = addPage(pdf);
			pageNumber += 1;
			y = height - 54;
			drawText(page, quotation.quotationNumber, margin, y, 10, bold, accent);
			drawRight(page, 'EQUIPMENT', width - margin, y, 9, bold, muted);
			y -= 28;
		}

		const rowHeight = 48;
		page.drawLine({
			start: { x: margin, y: y - rowHeight + 8 },
			end: { x: width - margin, y: y - rowHeight + 8 },
			thickness: 0.5,
			color: border
		});
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
	page.drawRectangle({ x: width - margin - 230, y: y - 112, width: 230, height: 124, color: soft });
	drawSummaryRow(
		page,
		'Equipment subtotal',
		formatVnd(quotation.equipmentSubtotalVnd),
		y - 20,
		regular
	);
	drawSummaryRow(
		page,
		`Discount (${quotation.equipmentDiscountPercent}%)`,
		`- ${formatVnd(quotation.equipmentDiscountVnd)}`,
		y - 40,
		regular
	);
	drawSummaryRow(page, 'Transport', formatVnd(quotation.transportVnd), y - 60, regular);
	drawSummaryRow(page, 'Handling', formatVnd(quotation.handlingVnd), y - 80, regular);
	page.drawLine({
		start: { x: width - margin - 218, y: y - 91 },
		end: { x: width - margin - 12, y: y - 91 },
		thickness: 0.7,
		color: border
	});
	drawSummaryRow(page, 'TOTAL', formatVnd(quotation.totalVnd), y - 108, regular, bold);

	if (quotation.notes) {
		y -= 148;
		if (y < 80) {
			drawFooter(page, pageNumber, regular);
			page = addPage(pdf);
			pageNumber += 1;
			y = height - 54;
		}
		y = drawLabel(page, 'Notes and terms', margin, y, bold);
		drawText(
			page,
			truncate(quotation.notes, regular, 9, width - margin * 2),
			margin,
			y,
			9,
			regular,
			muted
		);
	}

	drawFooter(page, pageNumber, regular);
	return pdf.save();
}
