// Theme state using Svelte 5 runes
class ThemeState {
	theme = $state<'light' | 'dark'>('dark');

	constructor() {
		if (typeof window !== 'undefined') {
			this.initTheme();
		}
	}

	private initTheme() {
		// Check localStorage first, then system preference
		const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
		if (stored) {
			this.theme = stored;
		} else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
			this.theme = 'light';
		}
		this.applyTheme();
	}

	private applyTheme() {
		if (this.theme === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}

	toggle() {
		this.theme = this.theme === 'dark' ? 'light' : 'dark';
		localStorage.setItem('theme', this.theme);
		this.applyTheme();
	}
}

export const themeState = new ThemeState();
