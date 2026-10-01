<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Users } from '@lucide/svelte';
	import type { PageData } from './$types';
	import type { LeadStatus } from '$lib/types/v2';
	import { updateLead } from '$lib/utils/v2/leads';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { formatDateString } from '$lib/utils/formatting';
	import { toast } from 'svelte-sonner';

	let { data }: { data: PageData } = $props();
	let updatingLeadId = $state<string | null>(null);

	const statusVariant: Record<LeadStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
		new: 'default',
		contacted: 'outline',
		qualified: 'default',
		converted: 'secondary',
		lost: 'destructive'
	};

	async function handleStatus(leadId: string, status: LeadStatus) {
		updatingLeadId = leadId;
		try {
			await updateLead(leadId, { status });
			await invalidateAll();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to update lead');
		} finally {
			updatingLeadId = null;
		}
	}
</script>

<div>
	<PageHeader
		title="Leads"
		description={`${data.leads.length} ${data.leads.length === 1 ? 'lead' : 'leads'}`}
	>
		{#snippet icon()}<Users class="size-5" />{/snippet}
	</PageHeader>

	{#if data.leads.length === 0}
		<div class="rounded-sm border border-border bg-card py-20 text-center">
			<Users class="mx-auto mb-4 size-12 text-muted-foreground" />
			<h2 class="text-lg font-semibold">No leads yet</h2>
			<p class="mt-2 text-sm text-muted-foreground">
				Leads will appear here when you create a quotation for someone who is not yet a client.
			</p>
		</div>
	{:else}
		<div class="overflow-x-auto rounded-sm border border-border bg-card">
			<table class="w-full min-w-[760px] text-left text-sm">
				<thead
					class="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground"
				>
					<tr>
						<th class="px-4 py-3">Lead</th>
						<th class="px-4 py-3">Contact</th>
						<th class="px-4 py-3">Quotations</th>
						<th class="px-4 py-3">Created</th>
						<th class="px-4 py-3">Status</th>
					</tr>
				</thead>
				<tbody>
					{#each data.leads as lead (lead.id)}
						<tr class="border-b border-border last:border-b-0">
							<td class="px-4 py-4">
								<div class="font-medium">{lead.name}</div>
								{#if lead.companyName}<div class="text-xs text-muted-foreground">
										{lead.companyName}
									</div>{/if}
							</td>
							<td class="px-4 py-4">
								<a class="text-primary hover:underline" href={`mailto:${lead.email}`}
									>{lead.email}</a
								>
								{#if lead.phone}<div class="text-xs text-muted-foreground">{lead.phone}</div>{/if}
							</td>
							<td class="px-4 py-4">{lead.quotationIds.length}</td>
							<td class="px-4 py-4">{formatDateString(lead.createdAt.toDate().toISOString())}</td>
							<td class="px-4 py-4">
								<div class="flex items-center gap-2">
									<Badge variant={statusVariant[lead.status]}>{lead.status}</Badge>
									<select
										aria-label={`Update status for ${lead.name}`}
										value={lead.status}
										disabled={updatingLeadId === lead.id}
										onchange={(event) =>
											handleStatus(
												lead.id,
												(event.currentTarget as HTMLSelectElement).value as LeadStatus
											)}
										class="rounded-sm border border-border bg-background px-2 py-1 text-xs"
									>
										<option value="new">New</option>
										<option value="contacted">Contacted</option>
										<option value="qualified">Qualified</option>
										<option value="converted">Converted</option>
										<option value="lost">Lost</option>
									</select>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
