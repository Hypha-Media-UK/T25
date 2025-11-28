<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<svelte:head>
	<title>Age Check</title>
	<meta name="description" content="Quick age verification for restricted items" />
</svelte:head>

{@render children()}
