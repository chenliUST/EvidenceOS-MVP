import type { DecisionRecommendation } from "./types";

export interface RecommendationInput {
  overallFitScore: number;
  evidenceConfidence: number;
  hasContradiction: boolean;
  hasCriticalUnverifiedRisk: boolean;
}

export function recommendDecision(input: RecommendationInput): DecisionRecommendation {
  const { overallFitScore, evidenceConfidence, hasContradiction, hasCriticalUnverifiedRisk } = input;

  if (hasCriticalUnverifiedRisk && overallFitScore < 70) {
    return "Hold";
  }

  if (overallFitScore >= 85 && evidenceConfidence >= 80 && !hasContradiction && !hasCriticalUnverifiedRisk) {
    return "Strong Proceed";
  }

  if (overallFitScore >= 70) {
    return "Proceed with Verification";
  }

  if (overallFitScore < 40 && evidenceConfidence >= 55) {
    return "Do Not Proceed Based on Current Evidence";
  }

  return "Hold";
}
