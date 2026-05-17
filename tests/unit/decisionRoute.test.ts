import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST as postDecision } from "@/app/api/cases/[caseId]/decision/route";
import { createFileStore } from "@/lib/storage/fileStore";

let dir: string;
let previousDataDir: string | undefined;

beforeEach(async () => {
  previousDataDir = process.env.EVIDENCEOS_DATA_DIR;
  dir = await mkdtemp(join(tmpdir(), "evidenceos-decision-route-test-"));
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

describe("decision route", () => {
  it("records a human decision and a pilot event", async () => {
    const store = createFileStore(dir);
    const ledger = await store.createCase({ mode: "investor", title: "Acme AI" });

    const response = await postDecision(
      new Request("http://evidenceos.test/api/cases/x/decision", {
        method: "POST",
        body: JSON.stringify({ decision: "Invest", overrideReason: "The memo surfaced enough verifiable traction." })
      }),
      { params: { caseId: ledger.caseId } }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.case.humanDecision.decision).toBe("Invest");
    expect(body.case.humanDecision.overrideReason).toContain("verifiable traction");
    expect(body.case.pilotEvents[0].type).toBe("human_decision_recorded");
  });

  it("returns 400 for invalid decision input", async () => {
    const store = createFileStore(dir);
    const ledger = await store.createCase({ mode: "hiring", title: "Candidate" });

    const response = await postDecision(
      new Request("http://evidenceos.test/api/cases/x/decision", {
        method: "POST",
        body: JSON.stringify({ decision: "Maybe", overrideReason: "" })
      }),
      { params: { caseId: ledger.caseId } }
    );

    expect(response.status).toBe(400);
  });

  it("returns 400 for unsafe case IDs and 404 for missing cases", async () => {
    const unsafeResponse = await postDecision(
      new Request("http://evidenceos.test/api/cases/x/decision", {
        method: "POST",
        body: JSON.stringify({ decision: "Hold", overrideReason: "Needs more evidence." })
      }),
      { params: { caseId: "../outside" } }
    );
    const missingResponse = await postDecision(
      new Request("http://evidenceos.test/api/cases/x/decision", {
        method: "POST",
        body: JSON.stringify({ decision: "Hold", overrideReason: "Needs more evidence." })
      }),
      { params: { caseId: randomUUID() } }
    );

    expect(unsafeResponse.status).toBe(400);
    expect(missingResponse.status).toBe(404);
  });
});
