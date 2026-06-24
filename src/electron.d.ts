// Obsidian's desktop runtime provides `electron`, and the esbuild bundle marks it
// external (see esbuild.config.mjs), so it is never an npm dependency. We declare
// only the sliver of its surface the plugin uses. Under vitest, the `electron`
// import resolves to a stub (test/mocks/electron.ts) via a resolve alias.
declare module "electron" {
	export const shell: {
		/**
		 * Open `path` in the desktop's default application for its type.
		 * Resolves to `""` on success, or to an error message string on failure.
		 */
		openPath(path: string): Promise<string>;
	};
}
