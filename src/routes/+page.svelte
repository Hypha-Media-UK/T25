<script lang="ts">
	import { supabase, type Category } from '$lib/supabase';
	import { onMount } from 'svelte';

	let categories = $state<Category[]>([]);
	let activeCategory = $state<Category | null>(null);
	let menuOpen = $state(false);
	let checkerOpen = $state(false);
	let selectedDate = $state('');
	let checkResult = $state<boolean | null>(null);

	const defaultColor = { bg: '#ede7b1', accent: '#ca8a04' };

	// Get colors from active category or fallback to default
	const getColor = () => {
		const bg = activeCategory?.color_bg ?? defaultColor.bg;
		const accent = activeCategory?.color_accent ?? defaultColor.accent;
		// Calculate a lighter fade version of the background
		const bgFade = lightenColor(bg, 0.5);
		return { bg, bgFade, accent };
	};

	// Lighten a hex color by a factor (0-1)
	const lightenColor = (hex: string, factor: number): string => {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		const newR = Math.round(r + (255 - r) * factor);
		const newG = Math.round(g + (255 - g) * factor);
		const newB = Math.round(b + (255 - b) * factor);
		return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
	};

	// Calculate relative luminance and return appropriate text colour
	const getContrastText = (hex: string): string => {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		// Using perceived luminance formula with stricter threshold
		const luminance = (r * 299 + g * 587 + b * 114) / 1000;
		return luminance > 180 ? '#1a1a1a' : '#ffffff';
	};

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

<main style="--cat-accent: {getColor().accent}; --cat-bg: {getColor().bg}; --cat-bg-fade: {getColor().bgFade}; --cat-text: {getContrastText(getColor().accent)}">
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
			<p>IF BORN ON OR BEFORE</p>
			<time>{formatDate(getCutoffDate())}</time>
		{/key}
	</section>

	{#if menuOpen}
		<aside data-menu>
			<button data-backdrop onclick={() => menuOpen = false} aria-label="Close menu"></button>
			<nav>
				<ul>
					{#each categories as cat}
						<li>
							<button
								data-active={activeCategory?.id === cat.id || undefined}
								onclick={() => { activeCategory = cat; menuOpen = false; }}
								style="--btn-accent: {cat.color_accent}; --btn-bg: {cat.color_bg}"
							>{cat.name}</button>
						</li>
					{/each}
				</ul>
				<a href="/settings">Settings</a>
			</nav>
		</aside>
	{/if}

	<button data-check-trigger onclick={() => checkerOpen = true}>Manually add a D.O.B.</button>

	{#if checkerOpen}
		<aside data-checker>
			<button data-backdrop onclick={() => { checkerOpen = false; resetCheck(); }} aria-label="Close checker"></button>
			<section>
				{#if checkResult === null}
					<p>Enter date of birth</p>
					<input
						type="date"
						bind:value={selectedDate}
						max={formatDateForInput(new Date())}
					/>
					<button onclick={checkAge}>Check</button>
				{:else if checkResult}
					<output data-success>Yes, {activeCategory?.min_age}+</output>
					<button onclick={resetCheck}>Check another</button>
				{:else}
					<output data-error>No, under {activeCategory?.min_age}</output>
					<button onclick={resetCheck}>Check another</button>
				{/if}
			</section>
		</aside>
	{/if}

</main>

<style>
	main {
		min-height: 100dvh;
		padding: var(--spacing);
		display: grid;
		grid-template-rows: auto 1fr auto;
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

	aside[data-menu] > nav {
		position: absolute;
		top: 0;
		left: 0;
		bottom: 0;
		width: 280px;
		max-width: 80vw;
		background: var(--surface);
		padding: var(--spacing);
		display: flex;
		flex-direction: column;
		animation: slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
	}

	aside[data-menu] ul {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex: 1;
		overflow-y: auto;
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

	aside[data-menu] > nav > a {
		padding: 16px;
		text-align: left;
		font-size: 1.1rem;
		font-weight: 500;
		color: var(--text);
		border-top: 1px solid var(--border);
		margin-top: auto;
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

	/* Date checker trigger */
	button[data-check-trigger] {
		padding: 14px 24px;
		background: var(--cat-accent);
		border-radius: var(--radius);
		font-weight: 700;
		font-size: 1rem;
		color: var(--cat-text);
	}

	/* Date checker modal */
	aside[data-checker] {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	aside[data-checker] > button[data-backdrop] {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.3);
		animation: fadeIn 0.3s ease-out;
	}

	aside[data-checker] > section {
		position: relative;
		background: var(--surface);
		padding: var(--spacing);
		border-radius: var(--radius);
		width: calc(100% - var(--spacing) * 2);
		max-width: 320px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		animation: contentIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
	}

	aside[data-checker] p {
		text-align: center;
		font-weight: 500;
		color: var(--text-muted);
	}

	aside[data-checker] input[type="date"] {
		width: 100%;
		padding: 16px;
		font-size: 1.1rem;
		text-align: center;
		border: 2px solid var(--border);
		border-radius: var(--radius-sm);
	}

	aside[data-checker] button:not([data-backdrop]) {
		padding: 16px;
		background: var(--cat-accent);
		color: white;
		border-radius: var(--radius-sm);
		font-weight: 600;
		font-size: 1rem;
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
</style>
