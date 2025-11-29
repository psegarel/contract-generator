<script lang="ts">
	import { signIn, resetPassword } from '$lib/utils/auth';
	import { goto } from '$app/navigation';
	import { Eye, EyeOff } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert';

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

		<form onsubmit={handleSubmit} class="space-y-5">
			<div>
				<Label for="email" class="mb-2">Email Address</Label>
				<Input id="email" type="email" bind:value={email} required placeholder="you@example.com" />
			</div>

			<div>
				<Label for="password" class="mb-2">Password</Label>
				<div class="relative">
					<Input
						id="password"
						type={showPassword ? 'text' : 'password'}
						bind:value={password}
						required
						class="pr-10"
						placeholder="••••••••"
					/>
					<button
						type="button"
						onclick={() => (showPassword = !showPassword)}
						class="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
					>
						{#if showPassword}
							<EyeOff class="h-4 w-4" />
						{:else}
							<Eye class="h-4 w-4" />
						{/if}
					</button>
				</div>
			</div>

			<Button type="submit" disabled={loading} class="w-full" size="lg">
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
				class="text-sm"
			>
				Forgot your password?
			</Button>
		</div>
		</CardContent>
	</Card>
</div>
