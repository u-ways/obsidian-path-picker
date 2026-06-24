import * as path from "path";

/** Where an absolute path sits relative to the Obsidian vault. */
export interface VaultLocation {
	/** True when the path is the vault root itself or anything beneath it. */
	inVault: boolean;
	/**
	 * The path expressed relative to the vault root, with POSIX separators and no
	 * leading slash — the form Obsidian's `getAbstractFileByPath` expects. `""`
	 * denotes the vault root itself. `null` when the path is not in the vault.
	 */
	relativePath: string | null;
}

const OUTSIDE: VaultLocation = { inVault: false, relativePath: null };

/** macOS and Windows default to case-insensitive filesystems; Linux does not. */
function platformCaseInsensitive(): boolean {
	return process.platform === "darwin" || process.platform === "win32";
}

/**
 * Decide whether `abs` lies within the vault rooted at `vaultRoot`, and if so its
 * vault-relative path.
 *
 * Pure path arithmetic — it never touches the filesystem. Both inputs are resolved
 * first so trailing slashes and `.`/`..` segments don't matter, and a sibling that
 * merely shares a name prefix (e.g. `/home/vault-old` against root `/home/vault`)
 * is correctly treated as outside.
 *
 * On case-insensitive filesystems the membership test folds case, because the vault
 * root (Obsidian's `getBasePath()`) and the walked entry can name the same directory
 * with different letter-casing when the user reached it via a differently-cased search
 * root. The returned `relativePath` keeps the entry's own on-disk casing (only the
 * root prefix above it may have differed), so it still matches Obsidian's index.
 *
 * `caseInsensitive` defaults to the host platform but is injectable for deterministic
 * tests.
 */
export function locateInVault(
	abs: string,
	vaultRoot: string | null,
	caseInsensitive: boolean = platformCaseInsensitive(),
): VaultLocation {
	if (!vaultRoot) return OUTSIDE;

	const root = path.resolve(vaultRoot);
	const target = path.resolve(abs);
	const fold = (p: string): string => (caseInsensitive ? p.toLowerCase() : p);

	if (fold(target) === fold(root)) return { inVault: true, relativePath: "" };

	// Match against root + separator so a sibling that merely shares a name prefix
	// isn't mistaken for a child. `path.resolve` only leaves a trailing separator on
	// the filesystem root itself ("/" or "C:\"), which we must not double up.
	const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep;
	if (!fold(target).startsWith(fold(rootWithSep))) return OUTSIDE;

	const rel = target.slice(rootWithSep.length);
	return { inVault: true, relativePath: rel.split(path.sep).join("/") };
}
