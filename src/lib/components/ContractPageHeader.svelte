<script lang="ts">
	let {
		title,
		subtitle
	}: {
		title: string;
		subtitle: string;
	} = $props();
</script>

<div class="py-6 px-8">
	<div class="max-w-7xl mx-auto space-y-8">
		<div class="space-y-1">
			<h1 class="text-5xl font-black tracking-tighter text-foreground">{title}</h1>
			<p class="text-sm text-muted-foreground uppercase tracking-widest font-bold">{subtitle}</p>
		</div>

		<slot />
	</div>
</div>
