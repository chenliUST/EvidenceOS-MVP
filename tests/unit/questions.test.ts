import { describe, expect, it } from "vitest";
import { generateQuestionsFromLedger } from "@/lib/domain/questions";
import type { EvidenceLedger } from "@/lib/domain/types";

const baseLedger: EvidenceLedger = {
  caseId: "case-1",
  mode: "investor",
  title: "Acme AI",
  materials: [],
  claims: [],
  evidence: [],
  scoreVector: [
    {
      key: "technicalCredibility",
      label: "Technical Credibility",
      score: 0,
      confidence: "Low",
      evidenceStatus: "Unverified",
      rationale: "Pending analysis."
    }
  ],
  questions: [],
  transcriptSegments: [],
  createdAt: "2026-05-16T00:00:00.000Z",
  updatedAt: "2026-05-16T00:00:00.000Z"
};

describe("generateQuestionsFromLedger", () => {
  it("prioritizes high-importance weak claims and preserves affected dimensions", () => {
    const questions = generateQuestionsFromLedger({
      ...baseLedger,
      claims: [
        {
          id: "c1",
          text: "Acme AI has production deployments.",
          importance: "High",
          evidenceStatus: "Weakly Supported",
          sourceMaterialIds: [],
          riskIfFalse: "The technical moat may be unproven.",
          verificationQuestion: "Which customers run this in production?",
          affectedDimensions: ["technicalCredibility"]
        },
        {
          id: "c2",
          text: "The market is large.",
          importance: "Low",
          evidenceStatus: "Partially Supported",
          sourceMaterialIds: [],
          riskIfFalse: "Market sizing may be generic.",
          verificationQuestion: "How large is the market?",
          affectedDimensions: ["marketTiming"]
        }
      ]
    });

    expect(questions[0].primaryQuestion).toBe("Which customers run this in production?");
    expect(questions[0].whyAsk).toContain("Acme AI has production deployments.");
    expect(questions[0].affectedDimensions).toEqual(["technicalCredibility"]);
    expect(questions[0].goodAnswerShouldInclude.length).toBeGreaterThanOrEqual(3);
  });

  it("falls back to low-confidence score dimensions when no claims exist", () => {
    const questions = generateQuestionsFromLedger(baseLedger);

    expect(questions).toHaveLength(1);
    expect(questions[0].primaryQuestion).toContain("Technical Credibility");
    expect(questions[0].affectedDimensions).toEqual(["technicalCredibility"]);
  });
});
