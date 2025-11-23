<script lang="ts">
	import { signIn, resetPassword } from '$lib/utils/auth';
	import { goto } from '$app/navigation';
	import { LogIn, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-svelte';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let successMessage = $state('');
	let loading = $state(false);
	let showPassword = $state(false);

	async function handlePasswordReset() {
		if (!email) {
			error = 'Please enter your email address';
			return;
		}

		error = '';
		successMessage = '';
		loading = true;

		try {
			await resetPassword(email);
			successMessage = 'Password reset email sent! Check your inbox.';
		} catch (err: any) {
			console.error('Password reset error:', err);
			if (err.code === 'auth/user-not-found') {
				error = 'No account found with this email';
			} else {
				error = 'Failed to send reset email. Please try again.';
			}
		} finally {
			loading = false;
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		loading = true;

		try {
			await signIn(email, password);
			goto('/contracts');
		} catch (err: any) {
			console.error('Login error:', err);
			// Handle Firebase auth errors
			if (err.code === 'auth/invalid-credential') {
				error = 'Invalid email or password';
			} else if (err.code === 'auth/user-not-found') {
				error = 'No account found with this email';
			} else if (err.code === 'auth/wrong-password') {
				error = 'Incorrect password';
			} else if (err.code === 'auth/too-many-requests') {
				error = 'Too many failed attempts. Please try again later';
			} else {
				error = 'Failed to sign in. Please try again';
			}
		} finally {
			loading = false;
		}
	}
</script>

<div class="w-full max-w-md">
	<div class="bg-white rounded-2xl shadow-xl p-8">
		<div class="text-center mb-8">
			<div class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
				<LogIn class="h-8 w-8 text-blue-600" />
			</div>
			<h2 class="text-3xl font-bold text-gray-900">Welcome Back</h2>
			<p class="text-gray-600 mt-2">Sign in to your account</p>
		</div>

		{#if error}
			<div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
				<AlertCircle class="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
				<p class="text-sm text-red-800">{error}</p>
			</div>
		{/if}

		{#if successMessage}
			<div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
				<AlertCircle class="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
				<p class="text-sm text-green-800">{successMessage}</p>
			</div>
		{/if}

		<form onsubmit={handleSubmit} class="space-y-6">
			<div>
				<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
					Email Address
				</label>
				<div class="relative">
					<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
						<Mail class="h-5 w-5 text-gray-400" />
					</div>
					<input
						id="email"
						type="email"
						bind:value={email}
						required
						class="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
						placeholder="you@example.com"
					/>
				</div>
			</div>

			<div>
				<label for="password" class="block text-sm font-medium text-gray-700 mb-2">
					Password
				</label>
				<div class="relative">
					<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
						<Lock class="h-5 w-5 text-gray-400" />
					</div>
					<input
						id="password"
						type={showPassword ? 'text' : 'password'}
						bind:value={password}
						required
						class="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
						placeholder="••••••••"
					/>
					<button
						type="button"
						onclick={() => showPassword = !showPassword}
						class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
					>
						{#if showPassword}
							<EyeOff class="h-5 w-5" />
						{:else}
							<Eye class="h-5 w-5" />
						{/if}
					</button>
				</div>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
			>
				{#if loading}
					<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
					<span>Signing in...</span>
				{:else}
					<LogIn class="h-5 w-5" />
					<span>Sign In</span>
				{/if}
			</button>
		</form>

		<div class="mt-6 text-center">
			<button
				type="button"
				onclick={handlePasswordReset}
				disabled={loading}
				class="text-sm text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50"
			>
				Forgot your password?
			</button>
		</div>
	</div>
</div>
