/** Type declarations for Svelte components */
declare module "*.svelte" {
	import type { Component } from "svelte";
	const component: Component;
	export default component;
}
