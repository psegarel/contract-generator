<script lang="ts">
	import type { UnifiedContract } from '$lib/utils/mergeContracts';
	import { formatDateString, formatCurrency } from '$lib/utils/formatting';
	import { Calendar, MapPin, User, Pencil, Check } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { authState } from '$lib/state/auth.svelte';
	import { toast } from 'svelte-sonner';
	import { updateServiceContractPaymentStatus } from '$lib/utils/serviceContracts';
	import { updateEventPlanningContractPaymentStatus } from '$lib/utils/eventPlanningContracts';

	interface Props {
		contract: UnifiedContract;
		index: number;
		onPaymentStatusUpdate?: (contract: UnifiedContract) => void;
	}

	let { contract, index, onPaymentStatusUpdate }: Props = $props();

	let isMarkingAsPaid = $state(false);

	function getContractTypeLabel(type: 'service' | 'event-planning'): string {
		return type === 'service' ? 'Service' : 'Event Planning';
	}

	function getContractLink(contract: UnifiedContract): string {
		return contract.type === 'service'
			? `/contracts/service-provision/${contract.id}`
			: `/contracts/event-planning/${contract.id}`;
	}

	async function togglePaymentStatus() {
		if (!authState.user?.uid) {
			toast.error('You must be logged in to update payment status');
			return;
		}

		isMarkingAsPaid = true;

		try {
			const newStatus: 'unpaid' | 'paid' = contract.paymentStatus === 'paid' ? 'unpaid' : 'paid';

			if (contract.type === 'service') {
				await updateServiceContractPaymentStatus(contract.id, newStatus, authState.user.uid);
			} else {
				await updateEventPlanningContractPaymentStatus(contract.id, newStatus, authState.user.uid);
			}

			// Update local contract state
			const updatedContract: UnifiedContract = {
				...contract,
				paymentStatus: newStatus
			};

			if (onPaymentStatusUpdate) {
				onPaymentStatusUpdate(updatedContract);
			}

			toast.success(`Contract marked as ${newStatus}`);
		} catch (error) {
			console.error('Error updating payment status:', error);
			toast.error('Failed to update payment status');
		} finally {
			isMarkingAsPaid = false;
		}
	}
</script>

<div class={index % 2 === 0 ? 'bg-white' : 'bg-slate-100/80'}>
	<!-- Mobile: Stacked Layout -->
	<div class="md:hidden space-y-4 py-3">
		<!-- Title and Type Badge -->
		<div class="flex items-start justify-between gap-3">
			<h3 class="text-xl font-bold leading-tight flex-1 tracking-tight">
				{contract.eventName}
			</h3>
			<Badge variant="outline" class="shrink-0">
				{getContractTypeLabel(contract.type)}
			</Badge>
		</div>

		<!-- Details -->
		<div class="space-y-2 text-sm text-muted-foreground">
			<div class="flex items-center gap-2.5">
				<Calendar class="h-4 w-4 shrink-0" />
				<span class="tracking-wide">{formatDateString(contract.date)}</span>
			</div>
			<div class="flex items-center gap-2.5">
				<MapPin class="h-4 w-4 shrink-0" />
				<span class="truncate">{contract.location}</span>
			</div>
			<div class="flex items-center gap-2.5">
				<User class="h-4 w-4 shrink-0" />
				<span class="truncate">{contract.clientName}</span>
			</div>
		</div>

		<!-- Value -->
		<div class="pt-1">
			<div class="text-base font-bold text-emerald-600 dark:text-emerald-400">
				{formatCurrency(contract.contractValue)}
			</div>
		</div>

		<!-- Actions -->
		<div class="pt-2 space-y-2">
			<Button
				size="sm"
				onclick={togglePaymentStatus}
				disabled={isMarkingAsPaid}
				class="w-full {contract.paymentStatus === 'paid'
					? 'bg-gray-600 hover:bg-gray-700'
					: 'bg-emerald-600 hover:bg-emerald-700'} text-white"
			>
				<Check class="h-3.5 w-3.5 mr-1.5" />
				{isMarkingAsPaid
					? 'Updating...'
					: contract.paymentStatus === 'paid'
						? 'Mark as Unpaid'
						: 'Mark as Paid'}
			</Button>
			<Button size="sm" href={getContractLink(contract)} class="w-full">
				<Pencil class="h-3.5 w-3.5 mr-1.5" />
				Edit
			</Button>
		</div>
	</div>

	<!-- Desktop: Grid Layout (16 columns for better spacing) -->
	<div class="hidden md:grid grid-cols-16 gap-3 items-center py-3 px-4">
		<!-- Event Name -->
		<div class="col-span-4">
			<h3 class="text-sm font-bold tracking-tight truncate">
				{contract.eventName}
			</h3>
		</div>

		<!-- Client Name -->
		<div class="col-span-3 text-sm truncate">
			{contract.clientName}
		</div>

		<!-- Contract Value -->
		<div
			class="col-span-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 text-right tabular-nums"
		>
			{formatCurrency(contract.contractValue)}
		</div>

		<!-- Date -->
		<div class="col-span-2 text-sm text-center tracking-wide">
			{formatDateString(contract.date)}
		</div>

		<!-- Location -->
		<div class="col-span-2 text-sm truncate">
			{contract.location}
		</div>

		<!-- Type Badge -->
		<div class="col-span-1 flex justify-center">
			<Badge variant="outline">
				{getContractTypeLabel(contract.type)}
			</Badge>
		</div>

		<!-- Payment Toggle Button -->
		<div class="col-span-1 flex justify-center">
			<Button
				size="sm"
				onclick={togglePaymentStatus}
				disabled={isMarkingAsPaid}
				class="px-2 {contract.paymentStatus === 'paid'
					? 'bg-gray-600 hover:bg-gray-700'
					: 'bg-emerald-600 hover:bg-emerald-700'} text-white"
				title={contract.paymentStatus === 'paid' ? 'Mark as Unpaid' : 'Mark as Paid'}
			>
				<Check class="h-4 w-4" />
			</Button>
		</div>

		<!-- Edit Button -->
		<div class="col-span-1 flex justify-center">
			<Button size="sm" href={getContractLink(contract)} class="px-2" title="Edit">
				<Pencil class="h-4 w-4" />
			</Button>
		</div>
	</div>
</div>
