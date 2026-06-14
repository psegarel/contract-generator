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
	[
		'i.e. on Saturday and Sunday',
		'i.e. on {{performanceDays}}'
	],
	// Performance hours + sets (EN uses "(04)" in the template, signed uses "(4)")
	[
		'four (04) hours, split into two (2) sets',
		'{{performanceHours}} ({{performanceHoursNumber}}) hours, split into {{numberOfSets}} ({{numberOfSetsNumber}}) sets'
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
	// Performance hours + sets (VN)
	[
		'bốn (4) giờ, chia thành hai (2) phần',
		'{{performanceHoursVietnamese}} ({{performanceHoursNumber}}) giờ, chia thành {{numberOfSetsVietnamese}} ({{numberOfSetsNumber}}) phần'
	],

	// ── Article 2: Fees ────────────────────────────────────────────────────────
	// English fee line (4 hours mention + fee amount)
	[
		'performance slot (4 hours) is 4,000,000 VND (Four million Vietnamese Dong)',
		'performance slot ({{performanceHoursNumber}} hours) is {{performanceFeeVND}} ({{performanceFeeInWords}})'
	],
	// Vietnamese fee line (template already uses Vietnamese number format)
	[
		'suất biểu diễn (4 giờ) là 4.000.000 VND (Bốn triệu đồng Việt Nam)',
		'suất biểu diễn ({{performanceHoursNumber}} giờ) là {{performanceFeeVND}} ({{performanceFeeInWordsVietnamese}})'
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
let missingCount = 0;

for (const [oldText, newText] of replacements) {
	if (xml.includes(oldText)) {
		xml = xml.replaceAll(oldText, newText);
		console.log(`✓  ${oldText.substring(0, 70)}`);
		successCount++;
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
console.log(`Applied: ${successCount} / ${replacements.length} replacements`);
if (missingCount > 0) {
	console.warn(`⚠  ${missingCount} strings not found — check for formatting changes in the template`);
} else {
	console.log('✅  Template patched successfully →', templatePath);
}
