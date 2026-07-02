<script lang="ts">
	import type { PerformanceLog } from '$lib/types/v2';
	import { Button } from '$lib/components/ui/button';
	import { Pencil, Trash2, Calendar, Clock, User } from 'lucide-svelte';
	import { formatCurrency, formatDateString } from '$lib/utils/formatting';

	interface Props {
		performance: PerformanceLog;
		onEdit: () => void;
		onDelete: () => void;
	}

	let { performance, onEdit, onDelete }: Props = $props();
</script>

<div
	class="flex items-center justify-between p-4 rounded-lg border {performance.invoiced
		? 'bg-gray-50 border-gray-200'
		: 'bg-white border-gray-200'}"
>
	<div class="flex items-center gap-4">
		<div class="flex items-center gap-2 text-gray-600">
			<Calendar class="w-4 h-4" />
			<span class="font-medium">{formatDateString(performance.date)}</span>
		</div>
		<div class="flex items-center gap-2 text-gray-600">
			<User class="w-4 h-4" />
			<span>{performance.performerName}</span>
		</div>
		<div class="flex items-center gap-2 text-gray-600">
			<Clock class="w-4 h-4" />
			<span>{performance.hoursWorked}h</span>
		</div>
		{#if performance.notes}
			<span class="text-sm text-gray-500 italic">{performance.notes}</span>
		{/if}
	</div>
	<div class="flex items-center gap-3">
		<div class="text-right">
			<p class="font-medium text-emerald-600">
				{formatCurrency(performance.performerPayVND ?? 0)}
			</p>
		</div>
		<Button
			variant="ghost"
			size="sm"
			onclick={onEdit}
			class="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
		>
			<Pencil class="w-4 h-4" />
		</Button>
		<Button
			variant="ghost"
			size="sm"
			onclick={onDelete}
			class="text-red-500 hover:text-red-700 hover:bg-red-50"
		>
			<Trash2 class="w-4 h-4" />
		</Button>
	</div>
</div>
