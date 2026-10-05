export function catalogueImageUrlForDisplay(url: string, width = 240, height?: number): string {
	try {
		const parsed = new URL(url);
		if (parsed.hostname.includes('imagekit.io')) {
			const transformations = ['f-jpg', 'q-75', `w-${Math.max(1, Math.floor(width))}`];
			if (height) {
				transformations.push(`h-${Math.max(1, Math.floor(height))}`, 'c-maintain_ratio');
			}
			parsed.searchParams.set('tr', transformations.join(','));
		}
		return parsed.toString();
	} catch {
		return url;
	}
}
