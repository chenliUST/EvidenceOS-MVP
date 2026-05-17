import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST as postAudio } from "@/app/api/cases/[caseId]/audio/route";
import { createFileStore } from "@/lib/storage/fileStore";

let dir: string;
let previousDataDir: string | undefined;
let previousProvider: string | undefined;

beforeEach(async () => {
  previousDataDir = process.env.EVIDENCEOS_DATA_DIR;
  previousProvider = process.env.AI_PROVIDER;
  dir = await mkdtemp(join(tmpdir(), "evidenceos-audio-route-test-"));
  process.env.EVIDENCEOS_DATA_DIR = dir;
  process.env.AI_PROVIDER = "fake";
});

afterEach(async () => {
  restoreEnv("EVIDENCEOS_DATA_DIR", previousDataDir);
  restoreEnv("AI_PROVIDER", previousProvider);
  await rm(dir, { recursive: true, force: true });
});

describe("audio route", () => {
  it("transcribes uploaded audio and appends a transcript material", async () => {
    const store = createFileStore(dir);
    const ledger = await store.createCase({ mode: "investor", title: "Acme AI" });
    const formData = new FormData();
    formData.append("audio", new Blob([Buffer.from("audio")], { type: "audio/webm" }), "meeting.webm");

    const response = await postAudio(
      new Request("http://evidenceos.test/api/cases/x/audio", {
        method: "POST",
        body: formData
      }),
      { params: { caseId: ledger.caseId } }
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.transcriptSegments[0].text).toContain("Fake transcript");
    expect(body.case.materials[0].type).toBe("transcript");
    expect(body.case.transcriptSegments).toHaveLength(1);
  });

  it("returns 400 for missing audio files", async () => {
    const store = createFileStore(dir);
    const ledger = await store.createCase({ mode: "hiring", title: "Candidate" });

    const response = await postAudio(
      new Request("http://evidenceos.test/api/cases/x/audio", {
        method: "POST",
        body: new FormData()
      }),
      { params: { caseId: ledger.caseId } }
    );

    expect(response.status).toBe(400);
  });

  it("returns 400 for unsafe case IDs and 404 for missing cases", async () => {
    const formData = new FormData();
    formData.append("audio", new Blob([Buffer.from("audio")], { type: "audio/webm" }), "meeting.webm");

    const unsafeResponse = await postAudio(
      new Request("http://evidenceos.test/api/cases/x/audio", {
        method: "POST",
        body: formData
      }),
      { params: { caseId: "../outside" } }
    );
    const missingResponse = await postAudio(
      new Request("http://evidenceos.test/api/cases/x/audio", {
        method: "POST",
        body: formData
      }),
      { params: { caseId: randomUUID() } }
    );

    expect(unsafeResponse.status).toBe(400);
    expect(missingResponse.status).toBe(404);
  });
});

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}
