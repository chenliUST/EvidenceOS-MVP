import { describe, expect, it } from "vitest";
import { renderDecisionMemoMarkdown } from "@/lib/memo/renderMarkdown";
import type { EvidenceLedger } from "@/lib/domain/types";

const ledger: EvidenceLedger = {
  caseId: "case-1",
  mode: "investor",
  title: "Acme AI",
  materials: [],
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
    }
  ],
  evidence: [],
  scoreVector: [
    {
      key: "technicalCredibility",
      label: "Technical Credibility",
      score: 68,
      confidence: "Medium",
      evidenceStatus: "Weakly Supported",
      rationale: "Production proof is still thin."
    }
  ],
  questions: [],
  transcriptSegments: [],
  createdAt: "2026-05-16T00:00:00.000Z",
  updatedAt: "2026-05-16T00:00:00.000Z",
  memo: {
    recommendation: "Proceed with Verification",
    overallFitScore: 72,
    evidenceConfidence: 58,
    topStrengths: ["Clear problem narrative"],
    topRisks: ["Production evidence is weak"],
    nextBestQuestions: [],
    rationale: "The case is promising but key claims require verification.",
    markdown: ""
  }
};

describe("renderDecisionMemoMarkdown", () => {
  it("renders the decision snapshot and claim matrix", () => {
    const markdown = renderDecisionMemoMarkdown(ledger);

    expect(markdown).toContain("# Acme AI Decision Memo");
    expect(markdown).toContain("Proceed with Verification");
    expect(markdown).toContain("Production evidence is weak");
    expect(markdown).toContain("Which customers run this in production?");
    expect(markdown).toContain("Technical Credibility");
  });
});
