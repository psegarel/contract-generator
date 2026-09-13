import PizZip from 'pizzip';

/**
 * Standard Vietnamese Republic header for all contracts.
 * HTML version for preview rendering.
 */
export const REPUBLIC_HEADER_HTML = `<div style="text-align: center; margin-bottom: 1.5em;">
<p style="margin: 0; font-weight: bold; font-size: 1.1em;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
<p style="margin: 0; font-weight: bold; font-size: 1.1em;">SOCIALIST REPUBLIC OF VIETNAM</p>
<p style="margin: 0.3em 0 0; font-weight: bold; font-style: italic;">Độc lập - Tự do - Hạnh phúc</p>
<p style="margin: 0; font-weight: bold; font-style: italic;">Independence - Freedom - Happiness</p>
<p style="margin: 0.5em auto 0; width: 30%; border-bottom: 1px solid #000;"></p>
</div>`;

/**
 * OOXML paragraphs for the republic header, injected into word/document.xml.
 * Uses WordprocessingML (w:) namespace elements.
 * sz values are in half-points (26 = 13pt).
 */
const REPUBLIC_HEADER_OOXML = [
	// CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
	'<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr><w:t>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</w:t></w:r></w:p>',
	// SOCIALIST REPUBLIC OF VIETNAM
	'<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr><w:t>SOCIALIST REPUBLIC OF VIETNAM</w:t></w:r></w:p>',
	// Độc lập - Tự do - Hạnh phúc
	'<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:i/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr><w:t>Độc lập - Tự do - Hạnh phúc</w:t></w:r></w:p>',
	// Independence - Freedom - Happiness
	'<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:i/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr><w:t>Independence - Freedom - Happiness</w:t></w:r></w:p>',
	// Separator line (centered, thin bottom border)
	'<w:p><w:pPr><w:jc w:val="center"/><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="000000"/></w:pBdr><w:ind w:left="2880" w:right="2880"/></w:pPr></w:p>',
	// Blank spacer paragraph
	'<w:p/>'
].join('');

/**
 * Inject the republic header into a rendered DOCX blob.
 * Unpacks the DOCX (ZIP), inserts OOXML paragraphs at the start of <w:body>,
 * and repacks as a new Blob.
 */
export async function injectRepublicHeaderIntoDocx(blob: Blob): Promise<Blob> {
	const arrayBuffer = await blob.arrayBuffer();
	const zip = new PizZip(arrayBuffer);

	const documentXml = zip.file('word/document.xml');
	if (!documentXml) {
		return blob;
	}

	const xml = documentXml.asText();

	// Insert header paragraphs right after <w:body> (with or without attributes)
	const modifiedXml = xml.replace(
		/(<w:body[^>]*>)/,
		`$1${REPUBLIC_HEADER_OOXML}`
	);

	zip.file('word/document.xml', modifiedXml);

	const newBlob = zip.generate({
		type: 'blob',
		mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
	}) as Blob;

	return newBlob;
}
