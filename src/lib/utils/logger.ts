/**
 * Logging utility with support for different log levels
 * Debug and info logs only appear in development mode
 */

import { dev } from '$app/environment';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
	/**
	 * Debug logging - only in development
	 * Use for detailed debugging information
	 */
	debug(...args: unknown[]): void {
		if (dev) {
			console.log('[DEBUG]', ...args);
		}
	}

	/**
	 * Info logging - only in development
	 * Use for general informational messages
	 */
	info(...args: unknown[]): void {
		if (dev) {
			console.info('[INFO]', ...args);
		}
	}

	/**
	 * Warning logging - always shown
	 * Use for recoverable issues that should be investigated
	 */
	warn(...args: unknown[]): void {
		console.warn('[WARN]', ...args);
	}

	/**
	 * Error logging - always shown
	 * Use for errors that affect functionality
	 */
	error(...args: unknown[]): void {
		console.error('[ERROR]', ...args);
	}

	/**
	 * Log with custom level
	 */
	log(level: LogLevel, ...args: unknown[]): void {
		switch (level) {
			case 'debug':
				this.debug(...args);
				break;
			case 'info':
				this.info(...args);
				break;
			case 'warn':
				this.warn(...args);
				break;
			case 'error':
				this.error(...args);
				break;
		}
	}
}

export const logger = new Logger();
