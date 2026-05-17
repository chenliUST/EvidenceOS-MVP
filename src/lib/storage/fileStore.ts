import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createInitialScoreVector } from "@/lib/domain/rubrics";
import type { CaseMode, EvidenceLedger } from "@/lib/domain/types";

export interface CreateCaseInput {
  mode: CaseMode;
  title: string;
}

export interface FileStore {
  createCase(input: CreateCaseInput): Promise<EvidenceLedger>;
  getCase(caseId: string): Promise<EvidenceLedger>;
  saveCase(ledger: EvidenceLedger): Promise<EvidenceLedger>;
  listCases(): Promise<EvidenceLedger[]>;
}

const now = () => new Date().toISOString();
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function assertValidCaseId(caseId: string) {
  if (!uuidPattern.test(caseId)) {
    throw new Error("Invalid caseId");
  }
}

export function createFileStore(rootDir = process.env.EVIDENCEOS_DATA_DIR ?? ".data/evidenceos"): FileStore {
  const casesDir = join(rootDir, "cases");

  async function ensure() {
    await mkdir(casesDir, { recursive: true });
  }

  function casePath(caseId: string) {
    assertValidCaseId(caseId);
    return join(casesDir, `${caseId}.json`);
  }

  return {
    async createCase(input) {
      await ensure();
      const timestamp = now();
      const ledger: EvidenceLedger = {
        caseId: randomUUID(),
        mode: input.mode,
        title: input.title,
        materials: [],
        claims: [],
        evidence: [],
        scoreVector: createInitialScoreVector(input.mode),
        questions: [],
        transcriptSegments: [],
        pilotEvents: [],
        createdAt: timestamp,
        updatedAt: timestamp
      };
      await writeFile(casePath(ledger.caseId), JSON.stringify(ledger, null, 2), "utf8");
      return ledger;
    },

    async getCase(caseId) {
      await ensure();
      const raw = await readFile(casePath(caseId), "utf8");
      return JSON.parse(raw) as EvidenceLedger;
    },

    async saveCase(ledger) {
      await ensure();
      const updated: EvidenceLedger = { ...ledger, updatedAt: now() };
      await writeFile(casePath(updated.caseId), JSON.stringify(updated, null, 2), "utf8");
      return updated;
    },

    async listCases() {
      await ensure();
      const files = await readdir(casesDir);
      const ledgers = await Promise.all(
        files
          .filter((file) => file.endsWith(".json"))
          .map(async (file) => JSON.parse(await readFile(join(casesDir, file), "utf8")) as EvidenceLedger)
      );
      return ledgers.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
  };
}
