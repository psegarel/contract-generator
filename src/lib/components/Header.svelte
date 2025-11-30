<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { themeStore } from '$lib/stores/theme.svelte';
	import { signOut } from '$lib/utils/auth';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { LogOut, Sun, Moon, Users, FileText } from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Avatar from '$lib/components/ui/avatar';

	async function handleSignOut() {
		try {
			await signOut();
			goto(resolve('/'));
		} catch (error) {
			console.error('Error signing out:', error);
		}
	}

	function getInitials(email: string | null | undefined): string {
		if (!email) return 'U';
		const parts = email.split('@')[0].split('.');
		if (parts.length >= 2) {
			return (parts[0][0] + parts[1][0]).toUpperCase();
		}
		return email.substring(0, 2).toUpperCase();
	}
</script>

<header class="bg-background border-b border-border">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between items-center h-14">
			<a
				href={resolve('/')}
				class="text-foreground hover:text-foreground/80 transition-colors font-medium"
			>
				Contract Generator
			</a>

			<!-- Navigation -->
			<nav class="flex items-center space-x-4">
				{#if authStore.isAuthenticated}
					<!-- User Menu -->
					<DropdownMenu.Root>
						<DropdownMenu.Trigger
							class="flex items-center space-x-2 p-1.5 hover:bg-muted rounded-md transition-colors"
						>
							<Avatar.Root class="h-8 w-8">
								<Avatar.Fallback class="bg-primary text-primary-foreground text-xs">
									{getInitials(authStore.user?.email)}
								</Avatar.Fallback>
							</Avatar.Root>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" class="w-56">
							<DropdownMenu.Label class="font-normal">
								<div class="flex flex-col space-y-1">
									<p class="text-xs text-muted-foreground truncate">
										{authStore.user?.email}
									</p>
								</div>
							</DropdownMenu.Label>
							<DropdownMenu.Separator />
							<DropdownMenu.Item onSelect={() => goto(resolve('/clients'))} class="cursor-pointer">
								<Users class="mr-2 h-4 w-4" />
								<span>Clients</span>
							</DropdownMenu.Item>
							<DropdownMenu.Sub>
								<DropdownMenu.SubTrigger class="cursor-pointer">
									<FileText class="h-4 w-4" />
									<span>Contracts</span>
								</DropdownMenu.SubTrigger>
								<DropdownMenu.SubContent class="min-w-[180px]">
									<DropdownMenu.Item onSelect={() => goto(resolve('/contracts/service-contract'))} class="cursor-pointer">
										<span>Service Contract</span>
									</DropdownMenu.Item>
									<DropdownMenu.Item onSelect={() => goto(resolve('/contracts'))} class="cursor-pointer">
										<span>View All Contracts</span>
									</DropdownMenu.Item>
								</DropdownMenu.SubContent>
							</DropdownMenu.Sub>
							<DropdownMenu.Separator />
							<DropdownMenu.Item onSelect={handleSignOut} class="cursor-pointer">
								<LogOut class="mr-2 h-4 w-4" />
								<span>Sign Out</span>
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				{/if}

				<!-- Theme Toggle -->
				<button
					onclick={() => themeStore.toggle()}
					class="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
					aria-label="Toggle theme"
				>
					{#if themeStore.theme === 'dark'}
						<Sun class="h-4 w-4" />
					{:else}
						<Moon class="h-4 w-4" />
					{/if}
				</button>
			</nav>
		</div>
	</div>
</header>
