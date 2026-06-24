import { describe, it, expect } from "vitest";
import { locateInVault } from "../../src/core/open";

describe("locateInVault", () => {
	const vault = "/home/me/vault";

	it("treats a null vault root as outside the vault", () => {
		expect(locateInVault("/home/me/vault/a.md", null)).toEqual({
			inVault: false,
			relativePath: null,
		});
	});

	it("maps the vault root itself to an empty relative path", () => {
		expect(locateInVault(vault, vault)).toEqual({ inVault: true, relativePath: "" });
	});

	it("ignores a trailing slash on either side", () => {
		expect(locateInVault(vault + "/", vault)).toEqual({ inVault: true, relativePath: "" });
		expect(locateInVault(vault + "/notes/a.md", vault + "/")).toEqual({
			inVault: true,
			relativePath: "notes/a.md",
		});
	});

	it("returns the POSIX relative path for a nested file", () => {
		expect(locateInVault(vault + "/a/b/c.md", vault)).toEqual({
			inVault: true,
			relativePath: "a/b/c.md",
		});
	});

	it("resolves '.' and '..' segments before deciding", () => {
		expect(locateInVault(vault + "/a/../b.md", vault)).toEqual({
			inVault: true,
			relativePath: "b.md",
		});
	});

	it("treats a sibling that shares a name prefix as outside", () => {
		expect(locateInVault("/home/me/vault-old/a.md", vault)).toEqual({
			inVault: false,
			relativePath: null,
		});
	});

	it("treats a parent or unrelated directory as outside", () => {
		expect(locateInVault("/home/me", vault)).toEqual({ inVault: false, relativePath: null });
		expect(locateInVault("/etc/hosts", vault)).toEqual({ inVault: false, relativePath: null });
	});

	it("keeps a child whose name merely starts with '..' inside the vault", () => {
		// "..config" is a literal filename, not a parent-directory hop.
		expect(locateInVault(vault + "/..config", vault)).toEqual({
			inVault: true,
			relativePath: "..config",
		});
	});

	it("folds case for the membership test when the filesystem is case-insensitive", () => {
		// macOS/Windows: the search root casing can differ from Obsidian's getBasePath()
		// for the same directory. The entry is still in the vault…
		expect(locateInVault("/Users/me/vault/notes/A.md", "/Users/me/Vault", true)).toEqual({
			inVault: true,
			// …and the relative part keeps the entry's own on-disk casing.
			relativePath: "notes/A.md",
		});
	});

	it("treats a case-divergent root as outside when the filesystem is case-sensitive", () => {
		expect(locateInVault("/Users/me/vault/notes/A.md", "/Users/me/Vault", false)).toEqual({
			inVault: false,
			relativePath: null,
		});
	});
});
