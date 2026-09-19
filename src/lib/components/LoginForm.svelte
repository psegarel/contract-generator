<script lang="ts">
	import { signIn, resetPassword } from '$lib/utils/auth';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Eye, EyeOff } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import TextField from '$lib/components/TextField.svelte';

	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '$lib/components/ui/card';
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert';
	import type { FirebaseError } from 'firebase/app';
	import { logger } from '$lib/utils/logger';

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
		} catch (err) {
			logger.error('Password reset error:', err);
			const firebaseError = err as FirebaseError;
			if (firebaseError.code === 'auth/user-not-found') {
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
			goto(resolve('/'));
		} catch (err) {
			logger.error('Login error:', err);
			const firebaseError = err as FirebaseError;
			if (firebaseError.code === 'auth/invalid-credential') {
				error = 'Invalid email or password';
			} else if (firebaseError.code === 'auth/user-not-found') {
				error = 'No account found with this email';
			} else if (firebaseError.code === 'auth/wrong-password') {
				error = 'Incorrect password';
			} else if (firebaseError.code === 'auth/too-many-requests') {
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
	<Card>
		<CardHeader>
			<CardTitle>Welcome Back</CardTitle>
			<CardDescription>Sign in to your account</CardDescription>
		</CardHeader>
		<CardContent>
			{#if error}
				<Alert variant="destructive" class="mb-6">
					<AlertTitle>Error</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			{/if}

			{#if successMessage}
				<Alert class="mb-6">
					<AlertTitle>Success</AlertTitle>
					<AlertDescription>{successMessage}</AlertDescription>
				</Alert>
			{/if}

			<form novalidate onsubmit={handleSubmit} class="space-y-5">
				<div class="relative">
					<TextField
						id="email"
						label="Email Address"
						type="email"
						bind:value={email}
						required
						placeholder="you@example.com"
					/>
				</div>

				<div class="relative">
					<TextField
						id="password"
						label="Password"
						type={showPassword ? 'text' : 'password'}
						bind:value={password}
						required
						placeholder="••••••••"
					/>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						class="absolute right-2 top-[2.2rem] h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
						onclick={() => (showPassword = !showPassword)}
					>
						{#if showPassword}
							<EyeOff class="h-4 w-4" />
						{:else}
							<Eye class="h-4 w-4" />
						{/if}
					</Button>
				</div>

				<Button type="submit" disabled={loading} variant="dark" class="w-full" size="lg">
					{#if loading}
						<span>Signing in...</span>
					{:else}
						<span>Sign In</span>
					{/if}
				</Button>
			</form>

			<div class="mt-6 text-center">
				<Button
					type="button"
					onclick={handlePasswordReset}
					disabled={loading}
					variant="link"
					class="text-sm text-foreground hover:text-foreground/80"
				>
					Forgot your password?
				</Button>
			</div>
		</CardContent>
	</Card>
</div>
