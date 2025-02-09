// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
	namespace App {
		// interface Error {}

		// Uncomment the `interface Locals` and create a `db` property
		interface Locals {
			db: Database;
		}
		
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
