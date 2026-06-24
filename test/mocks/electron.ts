// Runtime stub of the `electron` module for vitest. The real module is supplied by
// Obsidian's desktop runtime; the thin UI layer imports `shell` from it, so the
// stub only needs to let that import resolve. No test exercises an actual open.
export const shell = {
	openPath(_path: string): Promise<string> {
		return Promise.resolve("");
	},
};
