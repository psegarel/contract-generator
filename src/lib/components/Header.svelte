<script lang="ts">
	import { authState } from '$lib/state/auth.svelte';
	import { themeState } from '$lib/state/theme.svelte';
	import { signOut } from '$lib/utils/auth';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { LogOut, Sun, Moon, Users, FileText, CalendarCheck } from 'lucide-svelte';
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
				{#if authState.isAuthenticated}
					<!-- User Menu -->
					<DropdownMenu.Root>
						<DropdownMenu.Trigger
							class="flex items-center space-x-2 p-1.5 hover:bg-muted rounded-md transition-colors"
						>
							<Avatar.Root class="h-8 w-8">
								<Avatar.Fallback class="bg-primary text-primary-foreground text-xs">
									{getInitials(authState.user?.email)}
								</Avatar.Fallback>
							</Avatar.Root>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" class="w-56">
							<DropdownMenu.Label class="font-normal">
								<div class="flex flex-col space-y-1">
									<p class="text-xs text-muted-foreground truncate">
										{authState.user?.email}
									</p>
								</div>
							</DropdownMenu.Label>
							<DropdownMenu.Separator />
							<DropdownMenu.Sub>
								<DropdownMenu.SubTrigger class="cursor-pointer">
									<FileText class="h-4 w-4" />
									<span>Contracts</span>
								</DropdownMenu.SubTrigger>
								<DropdownMenu.SubContent class="min-w-[180px]">
									<!-- Contacts -->
									<DropdownMenu.Sub>
										<DropdownMenu.SubTrigger class="cursor-pointer">
											<Users class="h-4 w-4" />
											<span>Contacts</span>
										</DropdownMenu.SubTrigger>
										<DropdownMenu.SubContent>
											<DropdownMenu.Item
												onSelect={() => goto(resolve('/contacts'))}
												class="cursor-pointer"
											>
												<span>Create</span>
											</DropdownMenu.Item>
											<DropdownMenu.Item
												onSelect={() => goto(resolve('/contacts/list'))}
												class="cursor-pointer"
											>
												<span>List</span>
											</DropdownMenu.Item>
										</DropdownMenu.SubContent>
									</DropdownMenu.Sub>

									<!-- Event Planning -->
									<DropdownMenu.Sub>
										<DropdownMenu.SubTrigger class="cursor-pointer">
											<CalendarCheck class="h-4 w-4" />
											<span>Event Planning</span>
										</DropdownMenu.SubTrigger>
										<DropdownMenu.SubContent>
											<DropdownMenu.Item
												onSelect={() => goto(resolve('/contracts/event-planning'))}
												class="cursor-pointer"
											>
												<span>Create</span>
											</DropdownMenu.Item>
											<DropdownMenu.Item
												onSelect={() => goto(resolve('/contracts/event-planning/list'))}
												class="cursor-pointer"
											>
												<span>List</span>
											</DropdownMenu.Item>
										</DropdownMenu.SubContent>
									</DropdownMenu.Sub>

									<!-- Service -->
									<DropdownMenu.Sub>
										<DropdownMenu.SubTrigger class="cursor-pointer">
											<FileText class="h-4 w-4" />
											<span>Service</span>
										</DropdownMenu.SubTrigger>
										<DropdownMenu.SubContent>
											<DropdownMenu.Item
												onSelect={() => goto(resolve('/contracts/service'))}
												class="cursor-pointer"
											>
												<span>Create</span>
											</DropdownMenu.Item>
											<DropdownMenu.Item
												onSelect={() => goto(resolve('/contracts/service/list'))}
												class="cursor-pointer"
											>
												<span>List</span>
											</DropdownMenu.Item>
										</DropdownMenu.SubContent>
									</DropdownMenu.Sub>
								</DropdownMenu.SubContent>
							</DropdownMenu.Sub>
							<DropdownMenu.Separator />
							<DropdownMenu.Item onSelect={handleSignOut} class="cursor-pointer">
								<LogOut class="h-4 w-4" />
								<span>Sign Out</span>
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				{/if}

				<!-- Theme Toggle -->
				<button
					onclick={() => themeState.toggle()}
					class="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
					aria-label="Toggle theme"
				>
					{#if themeState.theme === 'dark'}
						<Sun class="h-4 w-4" />
					{:else}
						<Moon class="h-4 w-4" />
					{/if}
				</button>
			</nav>
		</div>
	</div>
</header>
