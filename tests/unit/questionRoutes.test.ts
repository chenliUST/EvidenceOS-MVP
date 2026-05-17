import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST as postQuestions } from "@/app/api/cases/[caseId]/questions/route";
import { createFileStore } from "@/lib/storage/fileStore";

let dir: string;
let previousDataDir: string | undefined;

beforeEach(async () => {
  previousDataDir = process.env.EVIDENCEOS_DATA_DIR;
  dir = await mkdtemp(join(tmpdir(), "evidenceos-question-route-test-"));
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

describe("question route", () => {
  it("generates and persists next-best questions", async () => {
    const store = createFileStore(dir);
    const ledger = await store.createCase({ mode: "investor", title: "Acme AI" });
    await store.saveCase({
      ...ledger,
      claims: [
        {
          id: "c1",
          text: "Acme AI has production deployments.",
          importance: "High",
          evidenceStatus: "Weakly Supported",
          sourceMaterialIds: [],
          riskIfFalse: "Production proof may be weak.",
          verificationQuestion: "Which customers run this in production?",
          affectedDimensions: ["technicalCredibility"]
        }
      ]
    });

    const response = await postQuestions(new Request("http://evidenceos.test/api/cases/x/questions"), {
      params: { caseId: ledger.caseId }
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.questions[0].primaryQuestion).toBe("Which customers run this in production?");
    expect(body.case.questions).toHaveLength(1);
  });

  it("returns 400 for unsafe case IDs and 404 for missing cases", async () => {
    const unsafeResponse = await postQuestions(new Request("http://evidenceos.test/api/cases/x/questions"), {
      params: { caseId: "../outside" }
    });
    const missingResponse = await postQuestions(new Request("http://evidenceos.test/api/cases/x/questions"), {
      params: { caseId: randomUUID() }
    });

    expect(unsafeResponse.status).toBe(400);
    expect(missingResponse.status).toBe(404);
  });
});
