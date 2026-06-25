import { describe, it, expect } from "vitest";
import { DEFAULT_SETTINGS, parseSkip, validateSkip } from "../../src/types";

// Guards the shipped default skip list: it is parsed with parseSkip at runtime, so a
// stray blank, surrounding whitespace, or an accidental duplicate would silently bloat
// every walk. These assertions keep the (long) default honest.
describe("DEFAULT_SETTINGS.skip", () => {
	const entries = parseSkip(DEFAULT_SETTINGS.skip);

	it("parses to a non-trivial list with no blank entries", () => {
		expect(entries.length).toBeGreaterThan(10);
		expect(entries.every((e) => e.length > 0)).toBe(true);
	});

	it("has no surrounding whitespace on any entry", () => {
		expect(entries.every((e) => e === e.trim())).toBe(true);
	});

	it("contains no duplicates", () => {
		expect(new Set(entries).size).toBe(entries.length);
	});

	it("still prunes the long-standing noise directories", () => {
		for (const dir of [".git", "node_modules", ".cache"]) {
			expect(entries).toContain(dir);
		}
	});

	it("passes validation with no flagged issues", () => {
		expect(validateSkip(DEFAULT_SETTINGS.skip)).toEqual([]);
	});
});

describe("validateSkip", () => {
	it("accepts a clean comma-separated list", () => {
		expect(validateSkip(".git, node_modules, .cache")).toEqual([]);
	});

	it("flags an entry with an internal space (a forgotten comma)", () => {
		expect(validateSkip("node_modules dist, .git")).toEqual([
			{ entry: "node_modules dist", kind: "whitespace" },
		]);
	});

	it("flags an internal newline as whitespace too", () => {
		expect(validateSkip("node_modules\ndist")).toEqual([
			{ entry: "node_modules\ndist", kind: "whitespace" },
		]);
	});

	it("flags an entry containing a path separator", () => {
		expect(validateSkip("src/node_modules")).toEqual([
			{ entry: "src/node_modules", kind: "separator" },
		]);
		expect(validateSkip("a\\b")).toEqual([{ entry: "a\\b", kind: "separator" }]);
	});

	it("flags consecutive commas as an empty entry", () => {
		expect(validateSkip("a,,b")).toEqual([{ entry: "", kind: "empty" }]);
		expect(validateSkip("a,,,,b")).toEqual([{ entry: "", kind: "empty" }]);
	});

	it("flags consecutive commas even with whitespace between them", () => {
		expect(validateSkip(".git, , node_modules")).toEqual([{ entry: "", kind: "empty" }]);
	});

	it("does not flag a single leading or trailing comma", () => {
		expect(validateSkip("node_modules, .cache,")).toEqual([]);
		expect(validateSkip(",node_modules, .cache")).toEqual([]);
	});

	it("ignores surrounding whitespace around otherwise-valid entries", () => {
		expect(validateSkip("  .git ,  node_modules  ")).toEqual([]);
	});

	it("treats comma+newline separated entries as clean (the parser trims them)", () => {
		expect(validateSkip(".git,\nnode_modules,\n.cache")).toEqual([]);
	});

	it("reports every offending entry", () => {
		expect(validateSkip("a b, ok, c/d")).toEqual([
			{ entry: "a b", kind: "whitespace" },
			{ entry: "c/d", kind: "separator" },
		]);
	});
});
