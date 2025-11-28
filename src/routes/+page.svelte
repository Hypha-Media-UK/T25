<script lang="ts">
	import { supabase, type Category } from '$lib/supabase';
	import { onMount } from 'svelte';

	let categories = $state<Category[]>([]);
	let activeCategory = $state<Category | null>(null);
	let selectedDate = $state('');
	let checkResult = $state<boolean | null>(null);

	// Category color themes
	const categoryColors: Record<string, { bg: string; bgFade: string; accent: string }> = {
		'Alcohol': { bg: '#fef3c7', bgFade: '#fffbeb', accent: '#d97706' },
		'Tobacco': { bg: '#fee2e2', bgFade: '#fef2f2', accent: '#dc2626' },
		'Gambling': { bg: '#e0e7ff', bgFade: '#eef2ff', accent: '#4f46e5' },
		'Meds': { bg: '#d1fae5', bgFade: '#ecfdf5', accent: '#059669' },
		'Fireworks': { bg: '#fce7f3', bgFade: '#fdf2f8', accent: '#db2777' }
	};

	const defaultColor = { bg: '#e0e7ff', bgFade: '#eef2ff', accent: '#6366f1' };

	const getColor = () => categoryColors[activeCategory?.name ?? ''] ?? defaultColor;

	// Calculate cutoff date for current category
	const getCutoffDate = () => {
		const today = new Date();
		const minAge = activeCategory?.min_age ?? 18;
		return new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
	};

	const formatDate = (date: Date) => {
		return date.toLocaleDateString('en-GB', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		}).replace(/\//g, '-');
	};

	const formatDateForInput = (date: Date) => {
		return date.toISOString().split('T')[0];
	};

	const checkAge = () => {
		if (!selectedDate || !activeCategory) return;
		const birthDate = new Date(selectedDate);
		const cutoff = getCutoffDate();
		checkResult = birthDate <= cutoff;
	};

	const resetCheck = () => {
		checkResult = null;
		selectedDate = formatDateForInput(getCutoffDate());
	};

	onMount(async () => {
		const { data } = await supabase
			.from('categories')
			.select('*')
			.order('sort_order');

		if (data && data.length > 0) {
			categories = data;
			activeCategory = data[0];
			selectedDate = formatDateForInput(getCutoffDate());
		}
	});

	$effect(() => {
		if (activeCategory) {
			resetCheck();
		}
	});
</script>

<main style="--cat-accent: {getColor().accent}; --cat-bg: {getColor().bg}; --cat-bg-fade: {getColor().bgFade}">
	<section data-tabs>
		{#each categories as cat}
			{@const color = categoryColors[cat.name] ?? defaultColor}
			<button
				data-active={activeCategory?.id === cat.id || undefined}
				onclick={() => activeCategory = cat}
				style="--btn-accent: {color.accent}; --btn-bg: {color.bg}"
			>{cat.name}</button>
		{/each}
	</section>

	<section data-display>
		<strong>{activeCategory?.min_age ?? 18}</strong>
		<p>SINCE</p>
		<time>{formatDate(getCutoffDate())}</time>
	</section>

	<section data-checker>
		{#if checkResult === null}
			<input
				type="date"
				bind:value={selectedDate}
				max={formatDateForInput(new Date())}
			/>
			<button onclick={checkAge}>Check Date</button>
		{:else if checkResult}
			<output data-success>Yes, {activeCategory?.min_age}+</output>
			<button onclick={resetCheck}>Check another</button>
		{:else}
			<output data-error>No, under {activeCategory?.min_age}</output>
			<button onclick={resetCheck}>Check another</button>
		{/if}
	</section>

	<nav>
		<a href="/settings">Settings</a>
	</nav>
</main>

<style>
	main {
		min-height: 100dvh;
		padding: var(--spacing);
		display: grid;
		grid-template-rows: auto 1fr auto auto;
		background: linear-gradient(180deg, var(--cat-bg-fade) 0%, var(--bg) 100%);
		transition: background 0.4s ease;
	}

	/* Tabs */
	section[data-tabs] {
		display: flex;
		gap: 2px;
		padding: 0 2px;
	}

	section[data-tabs] > button {
		flex: 1;
		padding: 12px 8px;
		background: var(--surface);
		border-radius: var(--radius) var(--radius) 0 0;
		white-space: nowrap;
		font-weight: 600;
		font-size: 0.85rem;
		color: var(--text-muted);
		opacity: 0.7;
		transition: all 0.2s ease;
	}

	section[data-tabs] > button[data-active] {
		color: var(--btn-accent);
		background: var(--cat-bg);
		opacity: 1;
	}

	/* Age display */
	section[data-display] {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 12px;
		padding: 20px;
		background: var(--cat-bg);
		border-radius: 0 0 var(--radius) var(--radius);
		margin-top: 0;
		margin-bottom: var(--spacing);
		transition: background 0.3s ease;
	}

	section[data-display] > strong {
		font-size: clamp(7rem, 28vw, 12rem);
		font-weight: 800;
		line-height: 1;
		color: var(--cat-accent);
		transition: color 0.3s ease;
	}

	section[data-display] > p {
		font-size: 1.1rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.15em;
		font-weight: 600;
	}

	section[data-display] > time {
		font-size: clamp(2rem, 7vw, 3rem);
		font-weight: 700;
		color: var(--cat-accent);
		transition: color 0.3s ease;
	}

	/* Date checker */
	section[data-checker] {
		display: flex;
		flex-direction: column;
		gap: 12px;
		background: var(--surface);
		padding: var(--spacing);
		border-radius: var(--radius);
		border: 2px solid var(--border);
	}

	section[data-checker] input[type="date"] {
		width: 100%;
		padding: 16px;
		font-size: 1.1rem;
		text-align: center;
	}

	section[data-checker] > button {
		padding: 16px;
		background: var(--cat-accent);
		color: white;
		border-radius: var(--radius-sm);
		font-weight: 600;
		font-size: 1rem;
		transition: background 0.3s ease;
	}

	output {
		padding: 24px;
		border-radius: var(--radius-sm);
		text-align: center;
		font-size: 1.5rem;
		font-weight: 700;
	}

	output[data-success] {
		background: var(--success-light);
		color: var(--success);
	}

	output[data-error] {
		background: var(--error-light);
		color: var(--error);
	}

	/* Navigation */
	nav {
		text-align: center;
		padding: 8px;
	}

	nav > a {
		padding: 12px 24px;
		display: inline-block;
		color: var(--text-muted);
		font-weight: 500;
	}
</style>
