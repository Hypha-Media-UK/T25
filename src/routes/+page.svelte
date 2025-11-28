<script lang="ts">
	import { supabase, type Category } from '$lib/supabase';
	import { onMount } from 'svelte';

	let categories = $state<Category[]>([]);
	let activeCategory = $state<Category | null>(null);
	let showDateChecker = $state(false);
	let selectedDate = $state('');
	let checkResult = $state<boolean | null>(null);

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

<main>
	<nav>
		{#each categories as cat}
			<button
				data-active={activeCategory?.id === cat.id || undefined}
				onclick={() => activeCategory = cat}
			>
				{cat.name}
			</button>
		{/each}
	</nav>

	<header>
		<strong>{activeCategory?.min_age ?? 18}</strong>
		<span>IF BORN BEFORE</span>
		<time>{formatDate(getCutoffDate())}</time>
	</header>

	<details bind:open={showDateChecker} onclose={resetCheck}>
		<summary>Check a date</summary>
		<section>
			{#if checkResult === null}
				<input
					type="date"
					bind:value={selectedDate}
					max={formatDateForInput(new Date())}
				/>
				<button onclick={checkAge}>Check</button>
			{:else if checkResult}
				<output data-success>✓ Yes, {activeCategory?.min_age}+</output>
				<button onclick={resetCheck}>Check another</button>
			{:else}
				<output data-error>✗ No, under {activeCategory?.min_age}</output>
				<button onclick={resetCheck}>Check another</button>
			{/if}
		</section>
	</details>

	<footer>
		<a href="/settings">Settings</a>
	</footer>
</main>

<style>
	main {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		padding: var(--spacing);
		gap: var(--spacing);
	}

	nav {
		display: flex;
		gap: 8px;
		overflow-x: auto;
		padding-bottom: 8px;
		-webkit-overflow-scrolling: touch;
	}

	nav > button {
		padding: 10px 16px;
		background: var(--surface);
		border-radius: 20px;
		white-space: nowrap;
		box-shadow: var(--shadow);
		transition: all 0.2s;
	}

	nav > button[data-active] {
		background: var(--accent);
		color: white;
	}

	header {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 8px;
	}

	header > strong {
		font-size: clamp(6rem, 25vw, 10rem);
		font-weight: 800;
		line-height: 1;
		color: var(--accent);
	}

	header > span {
		font-size: 1.25rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	header > time {
		font-size: clamp(1.75rem, 6vw, 2.5rem);
		font-weight: 600;
	}

	details {
		background: var(--surface);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
	}

	summary {
		padding: var(--spacing);
		cursor: pointer;
		text-align: center;
		font-weight: 500;
		color: var(--accent);
	}

	details > section {
		padding: 0 var(--spacing) var(--spacing);
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	details input[type="date"] {
		width: 100%;
		padding: 14px;
		font-size: 1.1rem;
	}

	details section > button {
		padding: 14px;
		background: var(--accent);
		color: white;
		border-radius: 8px;
		font-weight: 500;
	}

	output {
		padding: 20px;
		border-radius: 8px;
		text-align: center;
		font-size: 1.5rem;
		font-weight: 600;
	}

	output[data-success] {
		background: color-mix(in srgb, var(--success) 15%, transparent);
		color: var(--success);
	}

	output[data-error] {
		background: color-mix(in srgb, var(--error) 15%, transparent);
		color: var(--error);
	}

	footer {
		text-align: center;
		padding: var(--spacing);
	}

	footer > a {
		padding: 12px 24px;
		display: inline-block;
	}
</style>
