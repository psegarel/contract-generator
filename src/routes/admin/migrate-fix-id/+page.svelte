<script lang="ts">
	import { fixCounterpartyId } from '$lib/migration/fixCounterpartyId';
	import { authState } from '$lib/state/auth.svelte';
	import { goto } from '$app/navigation';

	let isRunning = $state(false);
	let isDryRun = $state(true);
	let logs = $state<string[]>([]);
	let completed = $state(false);
	let hasError = $state(false);
	let result = $state<{
		counterpartyFound: boolean;
		newId: string | null;
		contractsUpdated: number;
		contractsFailed: number;
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
			const message =
				'❌ ERROR: ' +
				args
					.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
					.join(' ');
			captureLog(message);
			originalError(...args);
		};

		try {
			const migrationResult = await fixCounterpartyId(isDryRun);
			result = migrationResult;
			completed = true;
		} catch (error) {
			hasError = true;
			console.error('Migration failed:', error);
		} finally {
			// Restore original console
			console.log = originalLog;
			console.error = originalError;
			isRunning = false;
		}
	}

	function clearLogs() {
		logs = [];
		completed = false;
		hasError = false;
		result = null;
	}
</script>

<div class="p-8">
	<div class="max-w-6xl mx-auto">
		<!-- Header -->
		<div class="bg-white rounded-lg shadow-sm p-6 mb-6">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Fix Counterparty ID</h1>
			<p class="text-gray-600">
				Fix counterparty with bad ID <code class="px-1.5 py-0.5 bg-gray-100 rounded text-sm">"Hoi An, Vietnam"</code>.
				Creates a new document with proper UUID and updates all related contracts.
			</p>

			{#if authState.user}
				<div class="mt-4 text-sm text-gray-500">
					Logged in as: <span class="font-medium">{authState.user.email}</span>
				</div>
			{/if}
		</div>

		<!-- Controls -->
		<div class="bg-white rounded-lg shadow-sm p-6 mb-6">
			<div class="flex items-center gap-6">
				<!-- Dry Run Toggle -->
				<label class="flex items-center gap-3 cursor-pointer">
					<input
						type="checkbox"
						bind:checked={isDryRun}
						disabled={isRunning}
						class="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
					/>
					<div>
						<div class="font-medium text-gray-900">Dry Run Mode</div>
						<div class="text-sm text-gray-500">
							Preview changes without writing to database
						</div>
					</div>
				</label>

				<!-- Run Button -->
				<button
					onclick={runMigration}
					disabled={isRunning}
					class="px-6 py-3 rounded-lg font-medium text-white transition-colors {isDryRun
						? 'bg-blue-600 hover:bg-blue-700'
						: 'bg-red-600 hover:bg-red-700'} disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if isRunning}
						<div class="flex items-center gap-2">
							<div
								class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
							></div>
							Running...
						</div>
					{:else if isDryRun}
						🔍 Run Dry Run
					{:else}
						🚀 Run Live Migration
					{/if}
				</button>

				{#if logs.length > 0}
					<button
						onclick={clearLogs}
						disabled={isRunning}
						class="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
					>
						Clear Logs
					</button>
				{/if}
			</div>

			{#if !isDryRun}
				<div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
					<div class="flex items-start gap-3">
						<div class="text-red-600 text-xl">⚠️</div>
						<div>
							<div class="font-medium text-red-900">Live Migration Mode</div>
							<div class="text-sm text-red-700 mt-1">
								This will write data to your Firestore database. Make sure you have a backup
								before proceeding.
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Result Summary -->
		{#if result}
			<div
				class="bg-white rounded-lg shadow-sm p-6 mb-6 border-2 {hasError
					? 'border-red-200'
					: 'border-green-200'}"
			>
				<h2 class="text-xl font-semibold mb-4">Migration Summary</h2>
				<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div>
						<div class="text-sm text-gray-500">Counterparty Found</div>
						<div class="text-2xl font-bold text-gray-900">
							{result.counterpartyFound ? 'Yes' : 'No'}
						</div>
					</div>
					{#if result.newId}
						<div>
							<div class="text-sm text-gray-500">New ID</div>
							<div class="text-sm font-mono font-bold text-gray-900 break-all">
								{result.newId}
							</div>
						</div>
					{/if}
					<div>
						<div class="text-sm text-gray-500">Contracts Updated</div>
						<div class="text-2xl font-bold text-green-600">{result.contractsUpdated}</div>
					</div>
					<div>
						<div class="text-sm text-gray-500">Contracts Failed</div>
						<div class="text-2xl font-bold text-red-600">{result.contractsFailed}</div>
					</div>
					<div>
						<div class="text-sm text-gray-500">Duration</div>
						<div class="text-2xl font-bold text-gray-900">
							{(result.duration / 1000).toFixed(2)}s
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Status -->
		{#if completed && !hasError}
			<div class="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
				<div class="flex items-center gap-3">
					<div class="text-green-600 text-2xl">✅</div>
					<div>
						<div class="font-medium text-green-900">Migration Completed Successfully</div>
						<div class="text-sm text-green-700 mt-1">
							{#if isDryRun}
								Review the logs below. When ready, uncheck "Dry Run Mode" and run again.
							{:else}
								Counterparty ID has been fixed and all related contracts have been updated.
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/if}

		{#if hasError}
			<div class="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
				<div class="flex items-center gap-3">
					<div class="text-red-600 text-2xl">❌</div>
					<div>
						<div class="font-medium text-red-900">Migration Failed</div>
						<div class="text-sm text-red-700 mt-1">
							Check the error logs below for details.
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Logs -->
		{#if logs.length > 0}
			<div class="bg-gray-900 rounded-lg shadow-sm p-6 overflow-auto max-h-[600px]">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-lg font-semibold text-white">Migration Logs</h2>
					<div class="text-sm text-gray-400">{logs.length} lines</div>
				</div>
				<div class="font-mono text-sm text-gray-100 whitespace-pre-wrap space-y-1">
					{#each logs as log}
						<div class="leading-relaxed">{log}</div>
					{/each}
				</div>
			</div>
		{:else}
			<div class="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
				<div class="text-4xl mb-4">📋</div>
				<div class="text-lg font-medium mb-2">No logs yet</div>
				<div class="text-sm">Click "Run Dry Run" to start the migration preview</div>
			</div>
		{/if}
	</div>
</div>





