import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST as postMemo } from "@/app/api/cases/[caseId]/memo/route";
import { createFileStore } from "@/lib/storage/fileStore";

let dir: string;
let previousDataDir: string | undefined;

beforeEach(async () => {
  previousDataDir = process.env.EVIDENCEOS_DATA_DIR;
  dir = await mkdtemp(join(tmpdir(), "evidenceos-memo-route-test-"));
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

describe("memo route", () => {
  it("creates a decision memo from the current ledger state", async () => {
    const store = createFileStore(dir);
    const ledger = await store.createCase({ mode: "investor", title: "Acme AI" });
    await store.saveCase({
      ...ledger,
      scoreVector: ledger.scoreVector.map((dimension, index) => ({
        ...dimension,
        score: index < 3 ? 76 : 48,
        confidence: index < 3 ? "Medium" : "Low",
        evidenceStatus: index < 3 ? "Partially Supported" : "Unverified",
        rationale: index < 3 ? "Some evidence exists." : "Evidence is missing."
      })),
      claims: [
        {
          id: "c1",
          text: "Acme AI has production deployments.",
          importance: "High",
          evidenceStatus: "Weakly Supported",
          sourceMaterialIds: [],
          riskIfFalse: "Production evidence is weak.",
          verificationQuestion: "Which customers run this in production?",
          affectedDimensions: ["technicalCredibility"]
        }
      ],
      questions: [
        {
          id: "q1",
          primaryQuestion: "Which customers run this in production?",
          whyAsk: "Validate deployment evidence.",
          goodAnswerShouldInclude: ["Customer", "Usage", "Metric"],
          followUpIfVague: "Ask for one concrete deployment.",
          redFlagAnswer: "Only generic statements.",
          affectedDimensions: ["technicalCredibility"]
        }
      ]
    });

    const response = await postMemo(new Request("http://evidenceos.test/api/cases/x/memo"), {
      params: { caseId: ledger.caseId }
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.memo.recommendation).toBeTruthy();
    expect(body.memo.markdown).toContain("Acme AI Decision Memo");
    expect(body.memo.nextBestQuestions).toHaveLength(1);
  });

  it("returns 400 for unsafe case IDs and 404 for missing cases", async () => {
    const unsafeResponse = await postMemo(new Request("http://evidenceos.test/api/cases/x/memo"), {
      params: { caseId: "../outside" }
    });
    const missingResponse = await postMemo(new Request("http://evidenceos.test/api/cases/x/memo"), {
      params: { caseId: randomUUID() }
    });

    expect(unsafeResponse.status).toBe(400);
    expect(missingResponse.status).toBe(404);
  });
});
