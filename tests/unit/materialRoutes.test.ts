import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST as postMaterial } from "@/app/api/cases/[caseId]/materials/route";
import { createFileStore } from "@/lib/storage/fileStore";

let dir: string;
let previousDataDir: string | undefined;

beforeEach(async () => {
  previousDataDir = process.env.EVIDENCEOS_DATA_DIR;
  dir = await mkdtemp(join(tmpdir(), "evidenceos-material-route-test-"));
  process.env.EVIDENCEOS_DATA_DIR = dir;
});

afterEach(async () => {
  if (previousDataDir === undefined) {
    delete process.env.EVIDENCEOS_DATA_DIR;
  } else {
    process.env.EVIDENCEOS_DATA_DIR = previousDataDir;
  }
  await rm(dir, { recursive: true, force: true });
});

describe("material routes", () => {
  it("adds a material to an existing case", async () => {
    const store = createFileStore(dir);
    const ledger = await store.createCase({ mode: "investor", title: "Acme AI Seed" });

    const response = await postMaterial(new Request("http://evidenceos.test/api/cases/x/materials", {
      method: "POST",
      body: JSON.stringify({
        title: "Founder notes",
        type: "text",
        text: "We have 12 paying customers."
      })
    }), { params: { caseId: ledger.caseId } });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.material.text).toContain("12 paying customers");
    expect(body.case).toBeUndefined();
    expect(body.materialCount).toBe(1);
  });

  it("returns 400 for invalid material input", async () => {
    const store = createFileStore(dir);
    const ledger = await store.createCase({ mode: "hiring", title: "Candidate" });

    const response = await postMaterial(new Request("http://evidenceos.test/api/cases/x/materials", {
      method: "POST",
      body: JSON.stringify({ title: "x", type: "link", text: " ", sourceUrl: "not-a-url" })
    }), { params: { caseId: ledger.caseId } });

    expect(response.status).toBe(400);
  });

  it("requires http links to include source URLs", async () => {
    const store = createFileStore(dir);
    const ledger = await store.createCase({ mode: "investor", title: "Acme AI Seed" });

    const missingSourceResponse = await postMaterial(new Request("http://evidenceos.test/api/cases/x/materials", {
      method: "POST",
      body: JSON.stringify({ title: "Website", type: "link", text: "Company claims production usage." })
    }), { params: { caseId: ledger.caseId } });
    const unsafeSchemeResponse = await postMaterial(new Request("http://evidenceos.test/api/cases/x/materials", {
      method: "POST",
      body: JSON.stringify({
        title: "Website",
        type: "link",
        text: "Company claims production usage.",
        sourceUrl: "javascript:alert(1)"
      })
    }), { params: { caseId: ledger.caseId } });

    expect(missingSourceResponse.status).toBe(400);
    expect(unsafeSchemeResponse.status).toBe(400);
  });

  it("rejects unsupported material types and over-budget text", async () => {
    const store = createFileStore(dir);
    const ledger = await store.createCase({ mode: "hiring", title: "Candidate" });

    const audioResponse = await postMaterial(new Request("http://evidenceos.test/api/cases/x/materials", {
      method: "POST",
      body: JSON.stringify({ title: "Audio", type: "audio", text: "raw transcript" })
    }), { params: { caseId: ledger.caseId } });
    const oversizedResponse = await postMaterial(new Request("http://evidenceos.test/api/cases/x/materials", {
      method: "POST",
      body: JSON.stringify({ title: "Long note", type: "text", text: "x".repeat(20_001) })
    }), { params: { caseId: ledger.caseId } });

    expect(audioResponse.status).toBe(400);
    expect(oversizedResponse.status).toBe(400);
  });

  it("returns 400 for unsafe case IDs and 404 for missing cases", async () => {
    const unsafeResponse = await postMaterial(new Request("http://evidenceos.test/api/cases/x/materials", {
      method: "POST",
      body: JSON.stringify({ title: "Founder notes", type: "text", text: "Notes" })
    }), { params: { caseId: "../outside" } });
    const missingResponse = await postMaterial(new Request("http://evidenceos.test/api/cases/x/materials", {
      method: "POST",
      body: JSON.stringify({ title: "Founder notes", type: "text", text: "Notes" })
    }), { params: { caseId: randomUUID() } });

    expect(unsafeResponse.status).toBe(400);
    expect(missingResponse.status).toBe(404);
  });
});
