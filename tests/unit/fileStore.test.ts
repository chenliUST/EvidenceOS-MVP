import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Material } from "@/lib/domain/types";
import { createFileStore } from "@/lib/storage/fileStore";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "evidenceos-test-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("fileStore", () => {
  it("creates and reads a case", async () => {
    const store = createFileStore(dir);
    const created = await store.createCase({ mode: "investor", title: "Acme AI Seed" });
    const loaded = await store.getCase(created.caseId);

    expect(loaded.title).toBe("Acme AI Seed");
    expect(loaded.mode).toBe("investor");
    expect(loaded.materials).toEqual([]);
    expect(loaded.scoreVector).toHaveLength(10);
  });

  it("lists created cases", async () => {
    const store = createFileStore(dir);
    await store.createCase({ mode: "hiring", title: "RAG Engineer Candidate" });
    const cases = await store.listCases();

    expect(cases).toHaveLength(1);
    expect(cases[0].title).toBe("RAG Engineer Candidate");
  });

  it("saves updates and refreshes updatedAt", async () => {
    const store = createFileStore(dir);
    const created = await store.createCase({ mode: "investor", title: "Acme AI Seed" });
    const material: Material = {
      id: "mat-1",
      type: "note",
      title: "Partner notes",
      text: "Founder has shipped production RAG systems.",
      createdAt: new Date().toISOString()
    };

    await new Promise((resolve) => setTimeout(resolve, 5));
    const saved = await store.saveCase({ ...created, materials: [material] });
    const loaded = await store.getCase(created.caseId);

    expect(saved.updatedAt > created.updatedAt).toBe(true);
    expect(loaded.materials).toEqual([material]);
  });

  it("lists newest updated cases first", async () => {
    const store = createFileStore(dir);
    const first = await store.createCase({ mode: "hiring", title: "First Candidate" });
    await new Promise((resolve) => setTimeout(resolve, 5));
    const second = await store.createCase({ mode: "investor", title: "Second Startup" });
    await store.saveCase({ ...first, title: "First Candidate Updated" });

    const cases = await store.listCases();

    expect(cases.map((item) => item.caseId)).toEqual([first.caseId, second.caseId]);
  });

  it("rejects unsafe case IDs", async () => {
    const store = createFileStore(dir);
    const created = await store.createCase({ mode: "hiring", title: "Safe Case" });

    await expect(store.getCase("../outside")).rejects.toThrow("Invalid caseId");
    await expect(store.getCase("not-a-uuid")).rejects.toThrow("Invalid caseId");
    await expect(store.saveCase({ ...created, caseId: "..\\outside" })).rejects.toThrow("Invalid caseId");
  });
});
