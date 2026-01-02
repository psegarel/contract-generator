<script lang="ts">
	import type { PageData } from './$types';
	import type { SavedEventPlanningContract } from '$lib/utils/eventPlanningContracts';
	import { updateEventPlanningContractPaymentStatus } from '$lib/utils/eventPlanningContracts';
	import { FileText, Check, X, Pencil } from 'lucide-svelte';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { authState } from '$lib/state/auth.svelte';
	import { toast } from 'svelte-sonner';

	let { data }: { data: PageData } = $props();
	let updatingPayment = $state<string | null>(null);

	function handleContractsUpdate(updatedContracts: SavedEventPlanningContract[]) {
		data.contracts = updatedContracts;
	}

	async function togglePaymentStatus(contract: SavedEventPlanningContract) {
		if (!authState.user?.uid) return;

		updatingPayment = contract.id;
		try {
			const newStatus = contract.paymentStatus === 'paid' ? 'unpaid' : 'paid';
			await updateEventPlanningContractPaymentStatus(
				contract.id,
				newStatus,
				authState.user.uid
			);

			// Update the local state
			contract.paymentStatus = newStatus;
			toast.success(`Payment status updated to ${newStatus}`);
		} catch (error) {
			console.error('Error updating payment status:', error);
			toast.error('Failed to update payment status');
		} finally {
			updatingPayment = null;
		}
	}
</script>

<div>

		<div class="mb-8">
			<h1 class="text-3xl font-medium text-foreground mb-3">Event Planning Contracts</h1>
			<p class="text-muted-foreground">View and manage your event planning contracts</p>
		</div>

			{#if data.contracts.length === 0}
				<Card class="p-12 text-center">
					<FileText class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
					<h3 class="text-lg font-medium text-foreground mb-2">No event planning contracts found</h3>
					<p class="text-muted-foreground mb-6">
						You haven't created any event planning contracts yet. Create your first contract to see it here.
					</p>
					<Button href="/contracts/event-planning">Create Event Planning Contract</Button>
				</Card>
			{:else}
				<div class="space-y-4">
					{#each data.contracts as contract (contract.id)}
						<Card class="p-6">
							<div class="flex justify-between items-start gap-4">
								<div class="flex-1">
									<div class="flex items-center gap-2 mb-3">
										<h3 class="text-lg font-semibold">{contract.contractData.eventName}</h3>
										<Badge variant={contract.paymentDirection === 'receivable' ? 'default' : 'secondary'}>
											{contract.paymentDirection === 'receivable' ? '↓ Receivable' : '↑ Payable'}
										</Badge>
										<Badge variant={contract.paymentStatus === 'paid' ? 'default' : 'outline'}>
											{contract.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
										</Badge>
									</div>
									<p class="text-sm text-muted-foreground">Client: {contract.contractData.clientCompany}</p>
									<p class="text-sm text-muted-foreground">Event Date: {contract.contractData.eventDate}</p>
									<p class="text-sm text-muted-foreground">Venue: {contract.contractData.eventVenue}</p>
									<p class="text-sm text-muted-foreground mt-2">Contract #: {contract.contractNumber}</p>
								</div>
								<div class="flex flex-col gap-2">
									<Button
										variant="outline"
										size="sm"
										href="/contracts/event-planning?edit={contract.id}"
									>
										<Pencil class="w-4 h-4 mr-1" />
										Edit
									</Button>
									<Button
										variant={contract.paymentStatus === 'paid' ? 'outline' : 'default'}
										size="sm"
										onclick={() => togglePaymentStatus(contract)}
										disabled={updatingPayment === contract.id}
									>
										{#if updatingPayment === contract.id}
											Updating...
										{:else if contract.paymentStatus === 'paid'}
											<X class="w-4 h-4 mr-1" />
											Mark Unpaid
										{:else}
											<Check class="w-4 h-4 mr-1" />
											Mark Paid
										{/if}
									</Button>
								</div>
							</div>
						</Card>
					{/each}
				</div>
			{/if}
	</div>

