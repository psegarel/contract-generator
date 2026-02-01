/**
 * Convert a number to Vietnamese words
 * Supports numbers up to billions
 */
export function numberToVietnameseWords(num: number): string {
	if (num === 0) return 'không';

	const ones = [
		'',
		'một',
		'hai',
		'ba',
		'bốn',
		'năm',
		'sáu',
		'bảy',
		'tám',
		'chín'
	];

	const tens = [
		'',
		'mười',
		'hai mươi',
		'ba mươi',
		'bốn mươi',
		'năm mươi',
		'sáu mươi',
		'bảy mươi',
		'tám mươi',
		'chín mươi'
	];

	const hundreds = [
		'',
		'một trăm',
		'hai trăm',
		'ba trăm',
		'bốn trăm',
		'năm trăm',
		'sáu trăm',
		'bảy trăm',
		'tám trăm',
		'chín trăm'
	];

	function convertThreeDigits(n: number): string {
		if (n === 0) return '';

		const hundred = Math.floor(n / 100);
		const remainder = n % 100;
		const ten = Math.floor(remainder / 10);
		const one = remainder % 10;

		let result = '';

		if (hundred > 0) {
			result += hundreds[hundred];
		}

		if (remainder > 0) {
			if (result) result += ' ';

			if (ten === 0) {
				result += ones[one];
			} else if (ten === 1) {
				if (one === 5) {
					result += 'mười lăm';
				} else if (one > 0) {
					result += `mười ${ones[one]}`;
				} else {
					result += 'mười';
				}
			} else {
				if (one === 5) {
					result += `${tens[ten]} lăm`;
				} else if (one === 1) {
					result += `${tens[ten]} mốt`;
				} else if (one > 0) {
					result += `${tens[ten]} ${ones[one]}`;
				} else {
					result += tens[ten];
				}
			}
		}

		return result;
	}

	const billions = Math.floor(num / 1_000_000_000);
	const millions = Math.floor((num % 1_000_000_000) / 1_000_000);
	const thousands = Math.floor((num % 1_000_000) / 1_000);
	const remainder = num % 1_000;

	const parts: string[] = [];

	if (billions > 0) {
		parts.push(`${convertThreeDigits(billions)} tỷ`);
	}
	if (millions > 0) {
		parts.push(`${convertThreeDigits(millions)} triệu`);
	}
	if (thousands > 0) {
		parts.push(`${convertThreeDigits(thousands)} nghìn`);
	}
	if (remainder > 0 || parts.length === 0) {
		parts.push(convertThreeDigits(remainder));
	}

	return parts.join(' ').trim();
}

/**
 * Convert a number to English words
 * Supports numbers up to billions
 */
export function numberToEnglishWords(num: number): string {
	if (num === 0) return 'zero';

	const ones = [
		'',
		'one',
		'two',
		'three',
		'four',
		'five',
		'six',
		'seven',
		'eight',
		'nine'
	];

	const teens = [
		'ten',
		'eleven',
		'twelve',
		'thirteen',
		'fourteen',
		'fifteen',
		'sixteen',
		'seventeen',
		'eighteen',
		'nineteen'
	];

	const tens = [
		'',
		'',
		'twenty',
		'thirty',
		'forty',
		'fifty',
		'sixty',
		'seventy',
		'eighty',
		'ninety'
	];

	function convertThreeDigits(n: number): string {
		if (n === 0) return '';

		const hundred = Math.floor(n / 100);
		const remainder = n % 100;
		const ten = Math.floor(remainder / 10);
		const one = remainder % 10;

		let result = '';

		if (hundred > 0) {
			result += `${ones[hundred]} hundred`;
		}

		if (remainder > 0) {
			if (result) result += ' ';

			if (ten === 1) {
				result += teens[one];
			} else {
				if (ten > 1) {
					result += tens[ten];
					if (one > 0) {
						result += `-${ones[one]}`;
					}
				} else {
					result += ones[one];
				}
			}
		}

		return result;
	}

	const billions = Math.floor(num / 1_000_000_000);
	const millions = Math.floor((num % 1_000_000_000) / 1_000_000);
	const thousands = Math.floor((num % 1_000_000) / 1_000);
	const remainder = num % 1_000;

	const parts: string[] = [];

	if (billions > 0) {
		parts.push(`${convertThreeDigits(billions)} billion`);
	}
	if (millions > 0) {
		parts.push(`${convertThreeDigits(millions)} million`);
	}
	if (thousands > 0) {
		parts.push(`${convertThreeDigits(thousands)} thousand`);
	}
	if (remainder > 0 || parts.length === 0) {
		parts.push(convertThreeDigits(remainder));
	}

	return parts.join(' ').trim();
}

/**
 * Convert days to Vietnamese words
 */
export function daysToVietnameseWords(days: number): string {
	return numberToVietnameseWords(days) + ' ngày';
}

/**
 * Convert days to English words
 */
export function daysToEnglishWords(days: number): string {
	const word = numberToEnglishWords(days);
	return word === 'one' ? 'one day' : `${word} days`;
}
