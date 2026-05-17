import { describe, expect, it } from "vitest";
import { applyAnalysisToLedger } from "@/lib/domain/ledger";
import type { EvidenceLedger } from "@/lib/domain/types";

const baseLedger: EvidenceLedger = {
  caseId: "case-1",
  mode: "investor",
  title: "Acme AI",
  materials: [
    {
      id: "m1",
      type: "text",
      title: "Deck",
      text: "We have deployed agentic RAG at 12 paying customers.",
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

describe("applyAnalysisToLedger", () => {
  it("writes AI analysis results into the ledger", () => {
    const updated = applyAnalysisToLedger(baseLedger, {
      claims: [
        {
          text: "Acme AI has 12 paying customers.",
          importance: "High",
          evidenceStatus: "Partially Supported",
          sourceMaterialIds: ["m1"],
          riskIfFalse: "Traction quality may be overstated.",
          verificationQuestion: "Can you show invoices or active usage from the 12 customers?",
          affectedDimensions: ["tractionQuality"]
        }
      ],
      evidence: [
        {
          claimText: "Acme AI has 12 paying customers.",
          sourceMaterialId: "m1",
          summary: "Deck states 12 paying customers.",
          status: "Partially Supported",
          impact: "Raises Score"
        }
      ],
      scoreVector: [
        {
          key: "tractionQuality",
          label: "Traction Quality",
          score: 68,
          confidence: "Medium",
          evidenceStatus: "Partially Supported",
          rationale: "Customer count is claimed but not independently proven."
        }
      ]
    });

    expect(updated.claims).toHaveLength(1);
    expect(updated.evidence).toHaveLength(1);
    expect(updated.evidence[0].claimId).toBe(updated.claims[0].id);
    expect(updated.scoreVector[0].score).toBe(68);
    expect(updated.updatedAt > baseLedger.updatedAt).toBe(true);
  });

  it("rejects analysis evidence that does not map to submitted materials and claims", () => {
    expect(() =>
      applyAnalysisToLedger(baseLedger, {
        claims: [
          {
            text: "Acme AI has 12 paying customers.",
            importance: "High",
            evidenceStatus: "Partially Supported",
            sourceMaterialIds: ["missing-material"],
            riskIfFalse: "Traction quality may be overstated.",
            verificationQuestion: "Can you show invoices?",
            affectedDimensions: ["tractionQuality"]
          }
        ],
        evidence: [
          {
            claimText: "A different claim",
            sourceMaterialId: "m1",
            summary: "Deck states 12 paying customers.",
            status: "Partially Supported",
            impact: "Raises Score"
          }
        ],
        scoreVector: []
      })
    ).toThrow("unknown material");
  });

  it("merges score updates into the existing rubric and clears stale derived outputs", () => {
    const ledger: EvidenceLedger = {
      ...baseLedger,
      scoreVector: [
        {
          key: "tractionQuality",
          label: "Traction Quality",
          score: 0,
          confidence: "Low",
          evidenceStatus: "Unverified",
          rationale: "Pending analysis."
        },
        {
          key: "marketTiming",
          label: "Market Timing",
          score: 0,
          confidence: "Low",
          evidenceStatus: "Unverified",
          rationale: "Pending analysis."
        }
      ],
      questions: [
        {
          id: "q1",
          primaryQuestion: "Old question?",
          whyAsk: "Old claim",
          goodAnswerShouldInclude: [],
          followUpIfVague: "Old follow-up",
          redFlagAnswer: "Old red flag",
          affectedDimensions: ["old"]
        }
      ],
      memo: {
        recommendation: "Hold",
        overallFitScore: 0,
        evidenceConfidence: 0,
        topStrengths: [],
        topRisks: [],
        nextBestQuestions: [],
        rationale: "Old memo",
        markdown: "Old memo"
      }
    };

    const updated = applyAnalysisToLedger(ledger, {
      claims: [],
      evidence: [],
      scoreVector: [
        {
          key: "tractionQuality",
          label: "Traction Quality",
          score: 68,
          confidence: "Medium",
          evidenceStatus: "Partially Supported",
          rationale: "Customer count is claimed but not independently proven."
        }
      ]
    });

    expect(updated.scoreVector).toHaveLength(2);
    expect(updated.scoreVector[0].score).toBe(68);
    expect(updated.scoreVector[1].key).toBe("marketTiming");
    expect(updated.questions).toEqual([]);
    expect(updated.memo).toBeUndefined();
  });
});
