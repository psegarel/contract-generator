<script lang="ts">
	import AuthGuard from '$lib/components/AuthGuard.svelte';
	import { resolve } from '$app/paths';
	import { FileText, ArrowRight } from 'lucide-svelte';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '$lib/components/ui/card';
</script>

<AuthGuard>
	<div class="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
		<div class="max-w-4xl mx-auto">
			<div class="mb-12">
				<h1 class="text-3xl font-medium text-foreground mb-3">Contract Templates</h1>
				<p class="text-muted-foreground">Choose a contract type to get started</p>
			</div>

			<div class="grid gap-4">
				<a href={resolve('/contracts/service-contract')} class="group">
					<Card class="p-6">
						<CardHeader class="p-0 mb-3">
							<div class="flex items-center justify-between">
								<div class="flex items-center space-x-3">
									<div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
										<FileText class="h-5 w-5 text-primary" />
									</div>
									<CardTitle class="text-lg">Service Contract</CardTitle>
								</div>
								<ArrowRight
									class="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all"
								/>
							</div>
						</CardHeader>
						<CardContent class="p-0">
							<CardDescription class="text-sm"
								>Professional service agreements for freelancers and contractors</CardDescription
							>
						</CardContent>
					</Card>
				</a>
			</div>
		</div>
	</div>
</AuthGuard>
