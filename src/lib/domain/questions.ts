import { randomUUID } from "node:crypto";
import type { Claim, EvidenceLedger, Question, ScoreDimension } from "@/lib/domain/types";

const maxQuestions = 8;

const evidencePriority: Record<Claim["evidenceStatus"], number> = {
  Contradictory: 5,
  Unverified: 4,
  "Weakly Supported": 3,
  "Partially Supported": 2,
  "Strongly Supported": 0
};

const importancePriority: Record<Claim["importance"], number> = {
  High: 3,
  Medium: 2,
  Low: 1
};

export function generateQuestionsFromLedger(ledger: EvidenceLedger): Question[] {
  const claimQuestions = [...ledger.claims]
    .sort((a, b) => {
      const evidenceDelta = evidencePriority[b.evidenceStatus] - evidencePriority[a.evidenceStatus];
      if (evidenceDelta !== 0) {
        return evidenceDelta;
      }
      return importancePriority[b.importance] - importancePriority[a.importance];
    })
    .slice(0, maxQuestions)
    .map((claim) => createClaimQuestion(claim, ledger.mode));

  if (claimQuestions.length > 0) {
    return claimQuestions;
  }

  return ledger.scoreVector
    .filter((dimension) => dimension.confidence !== "High" || dimension.evidenceStatus !== "Strongly Supported")
    .sort((a, b) => scoreDimensionPriority(b) - scoreDimensionPriority(a))
    .slice(0, maxQuestions)
    .map((dimension) => createDimensionQuestion(dimension, ledger.mode));
}

function createClaimQuestion(claim: Claim, mode: EvidenceLedger["mode"]): Question {
  return {
    id: randomUUID(),
    primaryQuestion: claim.verificationQuestion,
    whyAsk: `Validate decision-relevant claim: ${claim.text}`,
    goodAnswerShouldInclude: answerCriteriaForMode(mode),
    followUpIfVague:
      "Please give one concrete example with the actual context, your role, the evidence artifact, the metric, and the limitation.",
    redFlagAnswer: "Only repeats concepts, logos, tool names, or vision without concrete evidence, constraints, or failure cases.",
    affectedDimensions: claim.affectedDimensions
  };
}

function createDimensionQuestion(dimension: ScoreDimension, mode: EvidenceLedger["mode"]): Question {
  return {
    id: randomUUID(),
    primaryQuestion: `What is the strongest concrete evidence for ${dimension.label}?`,
    whyAsk: `This score dimension is still ${dimension.evidenceStatus} with ${dimension.confidence} confidence.`,
    goodAnswerShouldInclude: answerCriteriaForMode(mode),
    followUpIfVague:
      "Please walk through one real case, including the baseline, the decision you made, the result, and what did not work.",
    redFlagAnswer: "Gives generic best practices but no specific artifact, metric, timeline, owner, or tradeoff.",
    affectedDimensions: [dimension.key]
  };
}

function answerCriteriaForMode(mode: EvidenceLedger["mode"]) {
  if (mode === "hiring") {
    return [
      "Candidate's exact ownership",
      "Architecture or implementation detail",
      "Measurable outcome or failure evidence",
      "Tradeoff and boundary condition"
    ];
  }

  return [
    "Specific customer or user context",
    "Metric definition and measurement window",
    "Evidence artifact that can be checked",
    "Failure case or limiting assumption"
  ];
}

function scoreDimensionPriority(dimension: ScoreDimension) {
  const confidencePenalty = dimension.confidence === "Low" ? 3 : dimension.confidence === "Conflicted" ? 4 : 1;
  const evidencePenalty = dimension.evidenceStatus === "Unverified" ? 3 : dimension.evidenceStatus === "Contradictory" ? 4 : 1;
  return 100 - dimension.score + confidencePenalty * 10 + evidencePenalty * 10;
}
