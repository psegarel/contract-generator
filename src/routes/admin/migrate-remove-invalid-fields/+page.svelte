<script lang="ts">
	import { removeInvalidCounterpartyFields } from '$lib/migration/removeInvalidCounterpartyFields';
	import { authState } from '$lib/state/auth.svelte';
	import { goto } from '$app/navigation';

	let isRunning = $state(false);
	let isDryRun = $state(true);
	let logs = $state<string[]>([]);
	let completed = $state(false);
	let hasError = $state(false);
	let result = $state<{
		total: number;
		updated: number;
		skipped: number;
		failed: number;
		duration: number;
	} | null>(null);

	// Redirect if not authenticated
	$effect(() => {
		if (!authState.user) {
			goto('/login');
		}
	});

	// Capture console.log output
	function captureLog(message: string) {
		logs = [...logs, message];
	}

	async function runMigration() {
		if (isRunning) return;

		isRunning = true;
		completed = false;
		hasError = false;
		logs = [];
		result = null;

		// Override console.log to capture output
		const originalLog = console.log;
		const originalError = console.error;

		console.log = (...args: any[]) => {
			const message = args
				.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
				.join(' ');
			captureLog(message);
			originalLog(...args);
		};

		console.error = (...args: any[]) => {
			const message = args
				.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
				.join(' ');
			captureLog(`ERROR: ${message}`);
			originalError(...args);
		};

		try {
			const migrationResult = await removeInvalidCounterpartyFields(isDryRun);
			result = {
				total: migrationResult.total,
				updated: migrationResult.updated,
				skipped: migrationResult.skipped,
				failed: migrationResult.failed,
				duration: migrationResult.duration
			};
			completed = true;
			hasError = migrationResult.failed > 0;
		} catch (error) {
			console.error('Migration error:', error);
			hasError = true;
		} finally {
			// Restore original console methods
			console.log = originalLog;
			console.error = originalError;
			isRunning = false;
		}
	}
</script>

<div class="p-8 max-w-4xl mx-auto">
	<h1 class="text-2xl font-bold mb-6">Remove Invalid Counterparty Fields</h1>

	<div class="bg-white rounded-lg border border-gray-200 p-6 mb-6">
		<div class="mb-4">
			<label class="flex items-center gap-2">
				<input
					type="checkbox"
					bind:checked={isDryRun}
					disabled={isRunning}
					class="rounded border-gray-300"
				/>
				<span class="text-sm font-medium">Dry run (no database writes)</span>
			</label>
		</div>

		<button
			onclick={runMigration}
			disabled={isRunning}
			class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
		>
			{isRunning ? 'Running...' : isDryRun ? 'Run Dry Run' : 'Run Migration'}
		</button>
	</div>

	{#if result}
		<div
			class="bg-white rounded-lg border border-gray-200 p-6 mb-6 {hasError
				? 'border-red-500'
				: 'border-green-500'}"
		>
			<h2 class="text-lg font-semibold mb-4">Migration Results</h2>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<div class="text-sm text-gray-600">Total</div>
					<div class="text-2xl font-bold">{result.total}</div>
				</div>
				<div>
					<div class="text-sm text-gray-600">Updated</div>
					<div class="text-2xl font-bold text-green-600">{result.updated}</div>
				</div>
				<div>
					<div class="text-sm text-gray-600">Skipped</div>
					<div class="text-2xl font-bold text-gray-600">{result.skipped}</div>
				</div>
				<div>
					<div class="text-sm text-gray-600">Failed</div>
					<div class="text-2xl font-bold text-red-600">{result.failed}</div>
				</div>
			</div>
			<div class="mt-4">
				<div class="text-sm text-gray-600">Duration</div>
				<div class="text-lg font-semibold">{(result.duration / 1000).toFixed(2)}s</div>
			</div>
		</div>
	{/if}

	{#if logs.length > 0}
		<div class="bg-white rounded-lg border border-gray-200 p-6">
			<h2 class="text-lg font-semibold mb-4">Migration Logs</h2>
			<div class="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm max-h-96 overflow-y-auto">
				{#each logs as log}
					<div class="mb-1">{log}</div>
				{/each}
			</div>
		</div>
	{/if}
</div>







