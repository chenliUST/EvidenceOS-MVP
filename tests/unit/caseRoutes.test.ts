import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET as getCases, POST } from "@/app/api/cases/route";
import { GET as getCase } from "@/app/api/cases/[caseId]/route";

let dir: string;
let previousDataDir: string | undefined;

beforeEach(async () => {
  previousDataDir = process.env.EVIDENCEOS_DATA_DIR;
  dir = await mkdtemp(join(tmpdir(), "evidenceos-route-test-"));
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

describe("case routes", () => {
  it("creates and fetches a case", async () => {
    const createdResponse = await POST(
      new Request("http://evidenceos.test/api/cases", {
        method: "POST",
        body: JSON.stringify({ mode: "investor", title: "Acme AI Seed" })
      })
    );
    const createdBody = await createdResponse.json();

    expect(createdResponse.status).toBe(201);
    expect(createdBody.case.title).toBe("Acme AI Seed");

    const listedResponse = await getCases();
    const listedBody = await listedResponse.json();

    expect(listedBody.cases).toHaveLength(1);

    const fetchedResponse = await getCase(new Request("http://evidenceos.test/api/cases/x"), {
      params: { caseId: createdBody.case.caseId }
    });
    const fetchedBody = await fetchedResponse.json();

    expect(fetchedResponse.status).toBe(200);
    expect(fetchedBody.case.caseId).toBe(createdBody.case.caseId);
  });

  it("returns 400 for invalid case input", async () => {
    const response = await POST(
      new Request("http://evidenceos.test/api/cases", {
        method: "POST",
        body: JSON.stringify({ mode: "investor", title: " " })
      })
    );

    expect(response.status).toBe(400);
  });

  it("returns 400 for unsafe case IDs and 404 for missing cases", async () => {
    const unsafeResponse = await getCase(new Request("http://evidenceos.test/api/cases/x"), {
      params: { caseId: "../outside" }
    });
    const missingResponse = await getCase(new Request("http://evidenceos.test/api/cases/x"), {
      params: { caseId: randomUUID() }
    });

    expect(unsafeResponse.status).toBe(400);
    expect(missingResponse.status).toBe(404);
  });
});
