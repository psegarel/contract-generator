#!/usr/bin/env node
/**
 * Patches djResidency_updated.docx to replace hardcoded values with {{placeholders}}.
 *
 * Uses the signed contract (DJ_Residency_DJR-20260205-9759-06032026.docx) as the
 * authoritative source for article wording, then applies the same placeholders to
 * the existing djResidency_updated.docx (which already has Party A/B placeholders).
 *
 * Run from project root:
 *   node scripts/patch-dj-residency-template.mjs
 */

import PizZip from 'pizzip';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const templatePath = join(root, 'static', 'djResidency_updated.docx');

const content = readFileSync(templatePath);
const zip = new PizZip(content);
let xml = zip.file('word/document.xml').asText();

// ─── Replacements ─────────────────────────────────────────────────────────────
// Each entry: [exactString in XML, replacement]
// Order matters: more specific strings must come before shorter substrings.

const replacements = [
	// ── English Article 1 ──────────────────────────────────────────────────────
	// Duration + start/end dates (long phrase, do first)
	[
		'for four (04) months from 10 Feb 2026 to 09 June 2026',
		'for {{contractDurationMonths}} ({{contractDurationMonthsNumber}}) months from {{contractStartDateEnglish}} to {{contractEndDateEnglish}}'
	],
	// Performance days
	['i.e. on Saturday and Sunday', 'i.e. on {{performanceDays}}'],
	// Sets remain a contract-level expectation, while each set's duration is agreed per performance.
	[
		'{{performanceHours}} ({{performanceHoursNumber}}) hours, split into {{numberOfSets}} ({{numberOfSetsNumber}}) sets',
		'{{numberOfSets}} ({{numberOfSetsNumber}}) sets, with the duration of each set agreed by the Parties for each performance'
	],

	// ── Vietnamese Article 1 ───────────────────────────────────────────────────
	// Duration + start/end dates (long phrase, do first)
	[
		'bốn (04) tháng từ ngày 10 tháng 02 năm 2026 đến 09 tháng 06 năm 2026',
		'{{contractDurationMonthsVietnamese}} ({{contractDurationMonthsNumber}}) tháng từ ngày {{contractStartDateVietnamese}} đến {{contractEndDateVietnamese}}'
	],
	// Remove the day count ("hai (02) ngày") — signed contract omits it, using
	// "vào các ngày cuối tuần" instead, and replace inline performance days
	[
		'chuyên nghiệp hai (02) ngày cuối tuần mỗi tuần (cụ thể là Thứ Bảy và Chủ Nhật)',
		'chuyên nghiệp vào các ngày cuối tuần mỗi tuần (cụ thể là {{performanceDaysVietnamese}})'
	],
	// Performance hours are variable and agreed per performance (VN)
	[
		'{{performanceHoursVietnamese}} ({{performanceHoursNumber}}) giờ, chia thành {{numberOfSetsVietnamese}} ({{numberOfSetsNumber}}) phần',
		'{{numberOfSetsVietnamese}} ({{numberOfSetsNumber}}) phần, với thời lượng của từng phần do các Bên thỏa thuận cho từng buổi biểu diễn'
	],
	[
		'Each performance shall last {{numberOfSets}} ({{numberOfSetsNumber}}) sets, with the duration of each set agreed by the Parties for each performance',
		'Each performance shall consist of {{numberOfSets}} ({{numberOfSetsNumber}}) sets, with the duration of each set agreed by the Parties for each performance'
	],
	[
		'Mỗi buổi biểu diễn kéo dài {{numberOfSetsVietnamese}} ({{numberOfSetsNumber}}) phần, với thời lượng của từng phần do các Bên thỏa thuận cho từng buổi biểu diễn',
		'Mỗi buổi biểu diễn gồm {{numberOfSetsVietnamese}} ({{numberOfSetsNumber}}) phần, với thời lượng của từng phần do các Bên thỏa thuận cho từng buổi biểu diễn'
	],

	// ── Article 2: Fees ────────────────────────────────────────────────────────
	// English fee line: hourly rate applied to actual hours worked
	[
		'performance slot ({{performanceHoursNumber}} hours) is {{performanceFeeVND}} ({{performanceFeeInWords}})',
		'hour of performance is {{performanceFeeVND}} ({{performanceFeeInWords}})'
	],
	// Vietnamese fee line: hourly rate applied to actual hours worked
	[
		'suất biểu diễn ({{performanceHoursNumber}} giờ) là {{performanceFeeVND}} ({{performanceFeeInWordsVietnamese}})',
		'giờ biểu diễn là {{performanceFeeVND}} ({{performanceFeeInWordsVietnamese}})'
	],

	// ── Article 3: spacing fixes ───────────────────────────────────────────────
	['necessary equipment ( as agreed)', 'necessary equipment (as agreed)'],
	['cần thiết ( như thỏa thuận )', 'cần thiết (như thỏa thuận)'],

	// ── Article 4: Termination notice ─────────────────────────────────────────
	[
		'terminated by either Party with a 7-day written notice.',
		'terminated by either Party with a {{terminationNoticeDays}}-day written notice.'
	],
	[
		'thông báo bằng văn bản trước 7 ngày.',
		'thông báo bằng văn bản trước {{terminationNoticeDays}} ngày.'
	]
];

// ─── Apply replacements ───────────────────────────────────────────────────────
let successCount = 0;
let alreadyCorrectCount = 0;
let missingCount = 0;

for (const [oldText, newText] of replacements) {
	if (xml.includes(oldText)) {
		xml = xml.replaceAll(oldText, newText);
		console.log(`✓  ${oldText.substring(0, 70)}`);
		successCount++;
	} else if (xml.includes(newText)) {
		console.log(`↺  Already present: ${newText.substring(0, 70)}`);
		alreadyCorrectCount++;
	} else {
		console.warn(`✗  NOT FOUND: ${oldText.substring(0, 70)}`);
		missingCount++;
	}
}

// ─── Save ─────────────────────────────────────────────────────────────────────
zip.file('word/document.xml', xml);
const output = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
writeFileSync(templatePath, output);

console.log('\n' + '─'.repeat(60));
console.log(
	`Applied: ${successCount} / ${replacements.length} replacements (${alreadyCorrectCount} already present)`
);
if (missingCount > 0) {
	console.warn(
		`⚠  ${missingCount} strings not found — check for formatting changes in the template`
	);
} else {
	console.log('✅  Template patched successfully →', templatePath);
}
