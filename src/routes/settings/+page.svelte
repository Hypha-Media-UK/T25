<script lang="ts">
	import { supabase, type Category } from '$lib/supabase';
	import { onMount } from 'svelte';

	const AUTH_KEY = 'think25_auth';
	const AUTH_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

	let authenticated = $state(false);
	let passwordInput = $state('');
	let passwordError = $state(false);
	let categories = $state<Category[]>([]);
	let adminPassword = $state('');
	let newCategoryName = $state('');
	let newCategoryAge = $state(18);
	let editingId = $state<string | null>(null);
	let newPassword = $state('');
	let showPasswordChange = $state(false);
	let loading = $state(true);

	onMount(async () => {
		const stored = localStorage.getItem(AUTH_KEY);
		if (stored) {
			const { expiry } = JSON.parse(stored);
			if (expiry > Date.now()) {
				authenticated = true;
				await loadCategories();
			} else {
				localStorage.removeItem(AUTH_KEY);
			}
		}
		loading = false;
	});

	const login = async () => {
		const { data } = await supabase
			.from('settings')
			.select('value')
			.eq('key', 'admin_password')
			.single();

		if (data && data.value === passwordInput) {
			authenticated = true;
			adminPassword = data.value;
			localStorage.setItem(AUTH_KEY, JSON.stringify({ expiry: Date.now() + AUTH_DURATION }));
			await loadCategories();
		} else {
			passwordError = true;
			setTimeout(() => passwordError = false, 1500);
		}
	};

	const loadCategories = async () => {
		const { data } = await supabase
			.from('categories')
			.select('*')
			.order('sort_order');
		if (data) categories = data;
	};

	const addCategory = async () => {
		if (!newCategoryName.trim()) return;
		const maxOrder = Math.max(0, ...categories.map(c => c.sort_order));
		await supabase.from('categories').insert({
			name: newCategoryName.trim(),
			min_age: newCategoryAge,
			sort_order: maxOrder + 1
		});
		newCategoryName = '';
		newCategoryAge = 18;
		await loadCategories();
	};

	const updateCategory = async (cat: Category) => {
		await supabase
			.from('categories')
			.update({ name: cat.name, min_age: cat.min_age, color_bg: cat.color_bg, color_accent: cat.color_accent })
			.eq('id', cat.id);
		editingId = null;
	};

	const deleteCategory = async (id: string) => {
		await supabase.from('categories').delete().eq('id', id);
		await loadCategories();
	};

	const changePassword = async () => {
		if (!newPassword.trim()) return;
		await supabase
			.from('settings')
			.update({ value: newPassword })
			.eq('key', 'admin_password');
		adminPassword = newPassword;
		newPassword = '';
		showPasswordChange = false;
	};

	const logout = () => {
		localStorage.removeItem(AUTH_KEY);
		authenticated = false;
		passwordInput = '';
	};
</script>

<main>
	<header>
		<a href="/">← Back</a>
		<h1>Settings</h1>
	</header>

	{#if loading}
		<section data-login>
			<p>Loading...</p>
		</section>
	{:else if !authenticated}
		<section data-login>
			<h2>Enter Password</h2>
			<input
				type="password"
				bind:value={passwordInput}
				placeholder="Password"
				data-error={passwordError || undefined}
				onkeydown={(e) => e.key === 'Enter' && login()}
			/>
			<button onclick={login}>Unlock</button>
		</section>
	{:else}
		<section>
			<h2>Categories</h2>
			<ul>
				{#each categories as cat (cat.id)}
					<li>
						{#if editingId === cat.id}
							<input type="text" bind:value={cat.name} placeholder="Name" />
							<input type="number" bind:value={cat.min_age} min="1" max="99" />
							<fieldset>
								<label>
									Background
									<input type="color" bind:value={cat.color_bg} />
								</label>
								<label>
									Accent
									<input type="color" bind:value={cat.color_accent} />
								</label>
							</fieldset>
							<button onclick={() => updateCategory(cat)}>Save</button>
							<button onclick={() => editingId = null}>Cancel</button>
						{:else}
							<span style="background: {cat.color_bg}; color: {cat.color_accent}">{cat.name}</span>
							<em>Age {cat.min_age}+</em>
							<button onclick={() => editingId = cat.id}>Edit</button>
							<button data-danger onclick={() => deleteCategory(cat.id)}>Delete</button>
						{/if}
					</li>
				{/each}
			</ul>
		</section>

		<section data-add>
			<h2>Add Category</h2>
			<input type="text" bind:value={newCategoryName} placeholder="Name" />
			<input type="number" bind:value={newCategoryAge} min="1" max="99" />
			<button onclick={addCategory}>Add</button>
		</section>

		<section>
			<h2>Security</h2>
			{#if showPasswordChange}
				<input type="password" bind:value={newPassword} placeholder="New password" />
				<button onclick={changePassword}>Save Password</button>
				<button onclick={() => showPasswordChange = false}>Cancel</button>
			{:else}
				<button onclick={() => showPasswordChange = true}>Change Password</button>
				<button data-secondary onclick={logout}>Log Out</button>
			{/if}
		</section>
	{/if}
</main>

<style>
	main {
		min-height: 100dvh;
		padding: var(--spacing);
		display: flex;
		flex-direction: column;
		gap: var(--spacing);
	}

	header {
		display: flex;
		align-items: center;
		gap: var(--spacing);
	}

	header > a {
		padding: 8px;
	}

	header > h1 {
		font-size: 1.5rem;
	}

	section {
		background: var(--surface);
		border-radius: var(--radius);
		padding: var(--spacing);
		border: 2px solid var(--border);
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	section[data-login] {
		margin-top: auto;
		margin-bottom: auto;
	}

	section > h2 {
		font-size: 1rem;
		color: var(--text-muted);
	}

	ul {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	li {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
		padding: 12px;
		background: var(--bg);
		border-radius: var(--radius-sm);
	}

	li > span {
		font-weight: 600;
		padding: 4px 10px;
		border-radius: var(--radius-sm);
	}

	li > fieldset {
		display: flex;
		gap: 12px;
		border: none;
		padding: 0;
		width: 100%;
	}

	li > fieldset > label {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	li > fieldset input[type="color"] {
		width: 36px;
		height: 36px;
		padding: 2px;
		border: 2px solid var(--border);
		border-radius: var(--radius-sm);
		cursor: pointer;
	}

	li > em {
		color: var(--text-muted);
		font-style: normal;
		margin-right: auto;
	}

	li > input[type="text"] {
		flex: 1;
		min-width: 100px;
	}

	li > input[type="number"] {
		width: 70px;
	}

	li > button {
		padding: 8px 14px;
		border-radius: 8px;
		background: var(--accent);
		color: white;
		font-weight: 500;
	}

	li > button[data-danger] {
		background: var(--error);
	}

	section[data-add] {
		display: grid;
		grid-template-columns: 1fr auto auto;
		gap: 8px;
	}

	section[data-add] > h2 {
		grid-column: 1 / -1;
	}

	section[data-add] > input[type="number"] {
		width: 70px;
	}

	section > button {
		padding: 14px;
		background: var(--accent);
		color: white;
		border-radius: var(--radius-sm);
		font-weight: 600;
	}

	section > button[data-secondary] {
		background: var(--bg);
		color: var(--text-muted);
		border: 2px solid var(--border);
	}

	input[data-error] {
		border-color: var(--error);
		animation: shake 0.3s;
	}

	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		25% { transform: translateX(-5px); }
		75% { transform: translateX(5px); }
	}
</style>

