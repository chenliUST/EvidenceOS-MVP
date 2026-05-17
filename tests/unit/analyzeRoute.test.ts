import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/cases/[caseId]/analyze/route";
import { createFileStore } from "@/lib/storage/fileStore";

let dir: string;
let previousDataDir: string | undefined;
let previousProvider: string | undefined;
let previousApiKey: string | undefined;
let previousModel: string | undefined;

beforeEach(async () => {
  previousDataDir = process.env.EVIDENCEOS_DATA_DIR;
  previousProvider = process.env.AI_PROVIDER;
  previousApiKey = process.env.OPENAI_API_KEY;
  previousModel = process.env.OPENAI_CHAT_MODEL;
  dir = await mkdtemp(join(tmpdir(), "evidenceos-analyze-route-test-"));
  process.env.EVIDENCEOS_DATA_DIR = dir;
  process.env.AI_PROVIDER = "fake";
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_CHAT_MODEL;
});

afterEach(async () => {
  if (previousDataDir === undefined) {
    delete process.env.EVIDENCEOS_DATA_DIR;
  } else {
    process.env.EVIDENCEOS_DATA_DIR = previousDataDir;
  }
  if (previousProvider === undefined) {
    delete process.env.AI_PROVIDER;
  } else {
    process.env.AI_PROVIDER = previousProvider;
  }
  if (previousApiKey === undefined) {
    delete process.env.OPENAI_API_KEY;
  } else {
    process.env.OPENAI_API_KEY = previousApiKey;
  }
  if (previousModel === undefined) {
    delete process.env.OPENAI_CHAT_MODEL;
  } else {
    process.env.OPENAI_CHAT_MODEL = previousModel;
  }
  await rm(dir, { recursive: true, force: true });
});

describe("analyze route", () => {
  it("applies fake analysis to a case", async () => {
    const store = createFileStore(dir);
    const ledger = await store.createCase({ mode: "investor", title: "Acme AI" });
    await store.saveCase({
      ...ledger,
      materials: [
        {
          id: "m1",
          type: "text",
          title: "Deck",
          text: "We have 12 paying customers and deployed agentic RAG.",
          createdAt: "2026-05-16T00:00:00.000Z"
        }
      ]
    });

    const response = await POST(new Request("http://evidenceos.test/api/cases/x/analyze"), {
      params: { caseId: ledger.caseId }
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.case.claims).toHaveLength(1);
    expect(body.case.evidence).toHaveLength(1);
    expect(body.case.scoreVector[0].confidence).toBe("Medium");
  });

  it("returns 400 for unsafe case IDs and 404 for missing cases", async () => {
    const unsafeResponse = await POST(new Request("http://evidenceos.test/api/cases/x/analyze"), {
      params: { caseId: "../outside" }
    });
    const missingResponse = await POST(new Request("http://evidenceos.test/api/cases/x/analyze"), {
      params: { caseId: "11111111-1111-4111-8111-111111111111" }
    });

    expect(unsafeResponse.status).toBe(400);
    expect(missingResponse.status).toBe(404);
  });

  it("returns 400 for missing real provider configuration", async () => {
    const store = createFileStore(dir);
    const ledger = await store.createCase({ mode: "investor", title: "Acme AI" });
    process.env.AI_PROVIDER = "openai";

    const response = await POST(new Request("http://evidenceos.test/api/cases/x/analyze"), {
      params: { caseId: ledger.caseId }
    });

    expect(response.status).toBe(400);
  });
});
