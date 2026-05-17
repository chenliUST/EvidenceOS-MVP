import { recommendDecision } from "@/lib/domain/recommendation";
import type { DecisionMemo, EvidenceLedger, ScoreDimension } from "@/lib/domain/types";
import { renderDecisionMemoMarkdown } from "@/lib/memo/renderMarkdown";

export function createDecisionMemo(ledger: EvidenceLedger): DecisionMemo {
  const overallFitScore = averageScore(ledger.scoreVector);
  const evidenceConfidence = averageConfidence(ledger.scoreVector);
  const hasContradiction = ledger.claims.some((claim) => claim.evidenceStatus === "Contradictory");
  const hasCriticalUnverifiedRisk = ledger.claims.some(
    (claim) => claim.importance === "High" && claim.evidenceStatus === "Unverified"
  );
  const recommendation = recommendDecision({
    overallFitScore,
    evidenceConfidence,
    hasContradiction,
    hasCriticalUnverifiedRisk
  });

  const memoWithoutMarkdown: DecisionMemo = {
    recommendation,
    overallFitScore,
    evidenceConfidence,
    topStrengths: topStrengths(ledger.scoreVector),
    topRisks: topRisks(ledger),
    nextBestQuestions: ledger.questions.slice(0, 5),
    rationale:
      "Recommendation is based on the score vector, evidence confidence, unresolved high-impact claims, and contradiction checks.",
    markdown: ""
  };

  return {
    ...memoWithoutMarkdown,
    markdown: renderDecisionMemoMarkdown({ ...ledger, memo: memoWithoutMarkdown })
  };
}

function averageScore(scoreVector: ScoreDimension[]) {
  if (scoreVector.length === 0) {
    return 0;
  }
  return Math.round(scoreVector.reduce((sum, item) => sum + item.score, 0) / scoreVector.length);
}

function averageConfidence(scoreVector: ScoreDimension[]) {
  if (scoreVector.length === 0) {
    return 0;
  }
  return Math.round(scoreVector.reduce((sum, item) => sum + confidenceValue(item.confidence), 0) / scoreVector.length);
}

function confidenceValue(confidence: ScoreDimension["confidence"]) {
  switch (confidence) {
    case "High":
      return 90;
    case "Medium":
      return 65;
    case "Conflicted":
      return 35;
    case "Low":
      return 40;
  }
}

function topStrengths(scoreVector: ScoreDimension[]) {
  return scoreVector
    .filter((item) => item.score >= 70)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => `${item.label}: ${item.rationale}`);
}

function topRisks(ledger: EvidenceLedger) {
  const claimRisks = ledger.claims
    .filter((claim) => ["Weakly Supported", "Unverified", "Contradictory"].includes(claim.evidenceStatus))
    .sort((a, b) => riskPriority(b) - riskPriority(a))
    .slice(0, 3)
    .map((claim) => claim.riskIfFalse);

  if (claimRisks.length > 0) {
    return claimRisks;
  }

  return ledger.scoreVector
    .filter((item) => item.confidence !== "High")
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((item) => `${item.label}: ${item.rationale}`);
}

function riskPriority(claim: EvidenceLedger["claims"][number]) {
  const importance = claim.importance === "High" ? 3 : claim.importance === "Medium" ? 2 : 1;
  const evidence =
    claim.evidenceStatus === "Contradictory"
      ? 4
      : claim.evidenceStatus === "Unverified"
        ? 3
        : claim.evidenceStatus === "Weakly Supported"
          ? 2
          : 1;
  return importance * 10 + evidence;
}
