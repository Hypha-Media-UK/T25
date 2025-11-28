<script lang="ts">
	import { supabase, type Category } from '$lib/supabase';
	import { onMount } from 'svelte';

	let categories = $state<Category[]>([]);
	let activeCategory = $state<Category | null>(null);
	let menuOpen = $state(false);
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
	<section data-topbar>
		<span>{activeCategory?.name ?? ''}</span>
		<button data-hamburger onclick={() => menuOpen = !menuOpen} aria-label="Open menu">
			<i></i>
			<i></i>
			<i></i>
		</button>
	</section>

	<section data-display>
		{#key activeCategory?.id}
			<strong>{activeCategory?.min_age ?? 18}</strong>
			<p>SINCE</p>
			<time>{formatDate(getCutoffDate())}</time>
		{/key}
	</section>

	{#if menuOpen}
		<aside data-menu>
			<button data-backdrop onclick={() => menuOpen = false} aria-label="Close menu"></button>
			<ul>
				{#each categories as cat}
					{@const color = categoryColors[cat.name] ?? defaultColor}
					<li>
						<button
							data-active={activeCategory?.id === cat.id || undefined}
							onclick={() => { activeCategory = cat; menuOpen = false; }}
							style="--btn-accent: {color.accent}; --btn-bg: {color.bg}"
						>{cat.name}</button>
					</li>
				{/each}
			</ul>
		</aside>
	{/if}

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
		gap: var(--spacing);
		background: linear-gradient(180deg, var(--cat-bg-fade) 0%, var(--bg) 100%);
	}

	/* Top bar */
	section[data-topbar] {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 12px;
	}

	section[data-topbar] > span {
		font-weight: 600;
		font-size: 0.9rem;
		color: var(--cat-accent);
		background: var(--cat-bg);
		padding: 8px 14px;
		border-radius: var(--radius);
	}

	button[data-hamburger] {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 5px;
		padding: 10px;
		width: 44px;
		height: 44px;
	}

	button[data-hamburger] > i {
		display: block;
		height: 2px;
		background: var(--cat-accent);
		border-radius: 1px;
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
		border-radius: var(--radius);
	}

	/* Menu overlay */
	aside[data-menu] {
		position: fixed;
		inset: 0;
		z-index: 100;
	}

	aside[data-menu] > button[data-backdrop] {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.3);
		animation: fadeIn 0.3s ease-out;
	}

	aside[data-menu] > ul {
		position: absolute;
		top: 0;
		left: 0;
		bottom: 0;
		width: 280px;
		max-width: 80vw;
		background: var(--surface);
		list-style: none;
		padding: var(--spacing);
		display: flex;
		flex-direction: column;
		gap: 4px;
		overflow-y: auto;
		animation: slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
	}

	aside[data-menu] li > button {
		width: 100%;
		padding: 16px;
		text-align: left;
		font-size: 1.1rem;
		font-weight: 500;
		border-radius: var(--radius-sm);
		color: var(--text);
	}

	aside[data-menu] li > button[data-active] {
		background: var(--btn-bg);
		color: var(--btn-accent);
		font-weight: 600;
	}

	@keyframes slideIn {
		from {
			transform: translateX(-100%);
		}
		to {
			transform: translateX(0);
		}
	}

	section[data-display] > strong {
		font-size: clamp(7rem, 28vw, 12rem);
		font-weight: 800;
		line-height: 1;
		color: var(--cat-accent);
		animation: contentIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
	}

	section[data-display] > p {
		font-size: 1.1rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.15em;
		font-weight: 600;
		animation: contentIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both;
	}

	section[data-display] > time {
		font-size: clamp(2rem, 7vw, 3rem);
		font-weight: 700;
		color: var(--cat-accent);
		animation: contentIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
	}

	@keyframes contentIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
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
