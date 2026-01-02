<script lang="ts">
	import { 
		FileText, Users, DollarSign, Clock, TrendingUp, Download, CheckCircle, 
		AlertCircle, Mail, Lock, User, Calendar, ChevronDown, Save, Send, Trash2
	} from 'lucide-svelte';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';

	const COLORS = [
		{ name: 'Warm White', variable: '--background', desc: 'Main Page Background', class: 'bg-background border' },
		{ name: 'Elegant Gray', variable: '--sidebar', desc: 'Sidebar & Subtle Panels', class: 'bg-sidebar border' },
		{ name: 'Soft Charcoal', variable: '--foreground', desc: 'Main Text & Iconography', class: 'bg-foreground' },
		{ name: 'Elegant Rose', variable: '--primary', desc: 'Primary Action & Branding', class: 'bg-primary' },
		{ name: 'Soft Sage', variable: 'primary-sage', desc: 'Success & Alternative Accent', class: 'bg-emerald-500/10 text-emerald-600' },
	];

	const TYPOGRAPHY = [
		{ name: 'Heading 1', class: 'text-5xl font-black', sample: 'The Art of Contracts', font: 'Sans (Plus Jakarta)' },
		{ name: 'Heading 2', class: 'text-3xl font-extrabold', sample: 'Create with Elegance', font: 'Sans (Plus Jakarta)' },
		{ name: 'Heading 3', class: 'text-xl font-bold', sample: 'Seamless Generation', font: 'Sans (Plus Jakarta)' },
		{ name: 'Body Text', class: 'text-base font-normal', sample: 'Simplify your professional life with beautifully designed contract templates.', font: 'Sans (Inter)' },
		{ name: 'Small Caption', class: 'text-xs uppercase tracking-widest font-bold text-muted-foreground', sample: 'Update Required', font: 'Sans (Inter)' },
	];
</script>

<div class="max-w-6xl mx-auto space-y-16 pb-20">
	<!-- Hero Section -->
	<div class="text-center space-y-4">
		<h1 class="text-6xl text-foreground font-black tracking-tighter">Insense Design System</h1>
		<p class="text-muted-foreground max-w-2xl mx-auto text-lg">
			A modern, 2D approach to professional tooling. Built with clean color-blocking, crisp whites, and premium sans-serif typography.
		</p>
	</div>

	<!-- Color Palette -->
	<section class="space-y-6">
		<h2 class="text-3xl font-bold tracking-tight">Color Palette</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
			{#each COLORS as color (color.variable)}
				<div class="space-y-3">
					<div class="aspect-video rounded-3xl {color.class.replace('shadow-sm', '').replace('border', '')}"></div>
					<div class="px-1">
						<p class="font-bold text-sm tracking-tight">{color.name}</p>
						<p class="text-[10px] text-muted-foreground">{color.variable}</p>
						<p class="text-[10px] mt-1">{color.desc}</p>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- Typography -->
	<section class="space-y-6">
		<h2 class="text-3xl font-bold tracking-tight">Typography</h2>
		<div class="bg-secondary/40 rounded-[2.5rem] p-10 space-y-8">
			{#each TYPOGRAPHY as type (type.name)}
				<div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-foreground/5 pb-6 last:border-0 last:pb-0">
					<div class="space-y-1">
						<p class="text-[10px] font-black uppercase tracking-widest text-primary mb-2">{type.name} / {type.font}</p>
						<h3 class={type.class + " tracking-tight"}>{type.sample}</h3>
					</div>
					<p class="text-[10px] text-muted-foreground font-mono">{type.class} font-sans</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- Form Components Workshop -->
	<section class="space-y-8">
		<div class="space-y-2">
			<h2 class="text-3xl font-bold tracking-tight">Form Components</h2>
			<p class="text-sm text-muted-foreground">Clean 2D inputs and controls separated by refined colors.</p>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
			<!-- Input Showcase -->
			<div class="space-y-8">
				<div class="space-y-4">
					<p class="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center">
						<span class="w-8 h-px bg-foreground/10 mr-3"></span> Flat Inputs
					</p>
					
					<div class="space-y-4">
						<div class="space-y-1.5">
							<label class="text-xs font-bold ml-1 text-foreground/80" for="e1">Full Name</label>
							<div class="relative group">
								<div class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
									<User class="h-4 w-4" />
								</div>
								<input 
									type="text" 
									id="e1"
									placeholder="Jane Doe" 
									class="w-full bg-secondary/50 rounded-2xl py-3 pl-11 pr-4 text-sm border-none
									focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/50"
								/>
							</div>
						</div>

						<div class="space-y-1.5">
							<label class="text-xs font-bold ml-1 text-foreground/80" for="e2">Email Address</label>
							<div class="relative group">
								<div class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
									<Mail class="h-4 w-4" />
								</div>
								<input 
									type="email" 
									id="e2"
									placeholder="jane@example.com" 
									class="w-full bg-secondary/50 rounded-2xl py-3 pl-11 pr-4 text-sm border-none
									focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/50"
								/>
							</div>
						</div>
					</div>
				</div>

				<div class="space-y-4">
					<p class="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center">
						<span class="w-8 h-px bg-foreground/10 mr-3"></span> Selection & Date
					</p>
					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-1.5">
							<label class="text-xs font-bold ml-1 text-foreground/80" for="e3">Contract Type</label>
							<div class="relative group">
								<select 
									id="e3"
									class="w-full bg-secondary/50 rounded-2xl py-3 px-4 text-sm appearance-none border-none
									focus:ring-4 focus:ring-primary/10 outline-none transition-all"
								>
									<option>Service Level</option>
									<option>Event Planning</option>
									<option>Consultancy</option>
								</select>
								<ChevronDown class="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
							</div>
						</div>
						<div class="space-y-1.5">
							<label class="text-xs font-bold ml-1 text-foreground/80" for="e4">Effective Date</label>
							<div class="relative group">
								<div class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
									<Calendar class="h-4 w-4" />
								</div>
								<input 
									type="date" 
									id="e4"
									class="w-full bg-secondary/50 rounded-2xl py-3 pl-11 pr-4 text-sm border-none
									focus:ring-4 focus:ring-primary/10 outline-none transition-all"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Buttons Showcase -->
			<div class="space-y-8">
				<div class="space-y-4">
					<p class="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center">
						<span class="w-8 h-px bg-foreground/10 mr-3"></span> 2D Actions
					</p>
					<div class="flex flex-wrap gap-4">
						<button class="bg-primary text-primary-foreground font-bold px-8 py-3.5 rounded-2xl transition-all flex items-center gap-2 hover:bg-primary/90">
							<Save class="h-4 w-4" />
							Save Contract
						</button>
						<button class="bg-secondary text-secondary-foreground font-bold px-8 py-3.5 rounded-2xl hover:bg-foreground/5 transition-all flex items-center gap-2">
							<Send class="h-4 w-4" />
							Send for Signing
						</button>
						<button class="bg-secondary/40 text-foreground font-bold px-4 py-3.5 rounded-2xl hover:bg-secondary transition-all">
							Cancel
						</button>
						<button class="p-3.5 text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all">
							<Trash2 class="h-5 w-5" />
						</button>
					</div>
				</div>

				<div class="space-y-4">
					<p class="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center">
						<span class="w-8 h-px bg-foreground/10 mr-3"></span> Layout Blocks
					</p>
					<div class="grid grid-cols-2 gap-4">
						<div class="p-6 bg-emerald-500/5 rounded-3xl flex items-center space-x-4">
							<div class="p-2 bg-emerald-500/10 rounded-full">
								<CheckCircle class="h-5 w-5 text-emerald-600" />
							</div>
							<div>
								<p class="text-xs font-bold text-emerald-900">Success</p>
								<p class="text-[10px] text-emerald-700/80">Operation completed cleanly.</p>
							</div>
						</div>
						<div class="p-6 bg-rose-500/5 rounded-3xl flex items-center space-x-4">
							<div class="p-2 bg-rose-500/10 rounded-full">
								<AlertCircle class="h-5 w-5 text-rose-600" />
							</div>
							<div>
								<p class="text-xs font-bold text-rose-900">Error</p>
								<p class="text-[10px] text-rose-700/80">Please check your 2D input.</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
</div>
