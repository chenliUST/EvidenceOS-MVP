import { describe, expect, it } from "vitest";

import { createInitialScoreVector } from "@/lib/domain/rubrics";
import { recommendDecision } from "@/lib/domain/recommendation";

describe("recommendDecision", () => {
  it("recommends strong proceed for high score, high confidence, and no blocking risks", () => {
    expect(
      recommendDecision({
        overallFitScore: 88,
        evidenceConfidence: 86,
        hasContradiction: false,
        hasCriticalUnverifiedRisk: false
      })
    ).toBe("Strong Proceed");
  });

  it("recommends verification when score is high but confidence is low", () => {
    expect(
      recommendDecision({
        overallFitScore: 86,
        evidenceConfidence: 48,
        hasContradiction: false,
        hasCriticalUnverifiedRisk: false
      })
    ).toBe("Proceed with Verification");
  });

  it("recommends verification when contradictions block strong proceed", () => {
    expect(
      recommendDecision({
        overallFitScore: 92,
        evidenceConfidence: 90,
        hasContradiction: true,
        hasCriticalUnverifiedRisk: false
      })
    ).toBe("Proceed with Verification");
  });

  it("recommends verification when a critical unverified risk blocks strong proceed", () => {
    expect(
      recommendDecision({
        overallFitScore: 90,
        evidenceConfidence: 90,
        hasContradiction: false,
        hasCriticalUnverifiedRisk: true
      })
    ).toBe("Proceed with Verification");
  });

  it("holds when a critical unverified risk exists below the proceed threshold", () => {
    expect(
      recommendDecision({
        overallFitScore: 64,
        evidenceConfidence: 70,
        hasContradiction: false,
        hasCriticalUnverifiedRisk: true
      })
    ).toBe("Hold");
  });

  it("does not proceed when score is low and confidence is sufficient", () => {
    expect(
      recommendDecision({
        overallFitScore: 38,
        evidenceConfidence: 66,
        hasContradiction: false,
        hasCriticalUnverifiedRisk: false
      })
    ).toBe("Do Not Proceed Based on Current Evidence");
  });
});

describe("createInitialScoreVector", () => {
  it("creates the hiring rubric with ten unverified low-confidence dimensions", () => {
    const dimensions = createInitialScoreVector("hiring");

    expect(dimensions.map((dimension) => dimension.key)).toEqual([
      "roleFit",
      "ragArchitecture",
      "retrievalRanking",
      "evaluationExperimentation",
      "llmAppEngineering",
      "deploymentMonitoring",
      "dataEngineering",
      "researchDepth",
      "productJudgment",
      "technicalProbeCommunication"
    ]);
    expect(new Set(dimensions.map((dimension) => dimension.key)).size).toBe(10);
    expect(dimensions).toEqual(
      dimensions.map((dimension) =>
        expect.objectContaining({
          score: 0,
          confidence: "Low",
          evidenceStatus: "Unverified",
          rationale: "尚未分析。"
        })
      )
    );
  });

  it("creates the investor rubric with ten unverified low-confidence dimensions", () => {
    const dimensions = createInitialScoreVector("investor");

    expect(dimensions.map((dimension) => dimension.key)).toEqual([
      "founderMarketFit",
      "problemInsight",
      "technicalCredibility",
      "aiMoatEvidence",
      "executionCapability",
      "tractionQuality",
      "marketTiming",
      "businessModelClarity",
      "competitiveAwareness",
      "fundabilityNarrative"
    ]);
    expect(new Set(dimensions.map((dimension) => dimension.key)).size).toBe(10);
    expect(dimensions).toEqual(
      dimensions.map((dimension) =>
        expect.objectContaining({
          score: 0,
          confidence: "Low",
          evidenceStatus: "Unverified",
          rationale: "尚未分析。"
        })
      )
    );
  });
});
