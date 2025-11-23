// Translation utility using MyMemory API
export const translateToVietnamese = async (text: string): Promise<string> => {
	try {
		const encodedText = encodeURIComponent(text);
		const response = await fetch(
			`https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|vi`
		);
		
		if (!response.ok) {
			throw new Error('Translation API request failed');
		}
		
		const data = await response.json();
		
		if (data.responseStatus === 200 && data.responseData?.translatedText) {
			return data.responseData.translatedText;
		}
		
		// Fallback to original text if translation fails
		console.warn('Translation failed, using original text');
		return text;
	} catch (error) {
		console.error('Translation error:', error);
		// Return original text on error
		return text;
	}
};
