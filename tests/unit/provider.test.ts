import { describe, expect, it } from "vitest";
import { buildAnalysisPayload, MAX_ANALYSIS_TOTAL_TEXT } from "@/lib/ai/provider";
import type { EvidenceLedger } from "@/lib/domain/types";

describe("buildAnalysisPayload", () => {
  it("sends a bounded, decision-relevant subset of the ledger", () => {
    const ledger: EvidenceLedger = {
      caseId: "case-1",
      mode: "investor",
      title: "Acme AI",
      materials: [
        {
          id: "m1",
          type: "text",
          title: "Deck",
          text: "a".repeat(10_000),
          createdAt: "2026-05-16T00:00:00.000Z"
        },
        {
          id: "m2",
          type: "note",
          title: "Call notes",
          text: "b".repeat(10_000),
          createdAt: "2026-05-16T00:00:00.000Z"
        }
      ],
      claims: [],
      evidence: [],
      scoreVector: [],
      questions: [],
      transcriptSegments: [],
      createdAt: "2026-05-16T00:00:00.000Z",
      updatedAt: "2026-05-16T00:00:00.000Z"
    };

    const payload = buildAnalysisPayload(ledger);
    const submittedTextLength = payload.materials.reduce((total, material) => total + material.text.length, 0);

    expect(submittedTextLength).toBeLessThanOrEqual(MAX_ANALYSIS_TOTAL_TEXT);
    expect(payload.materials[0]).not.toHaveProperty("createdAt");
    expect(payload).not.toHaveProperty("claims");
    expect(payload).not.toHaveProperty("evidence");
  });
});
