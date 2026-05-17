import type { CaseMode, ScoreDimension } from "./types";

const baseDimension = (key: string, label: string): ScoreDimension => ({
  key,
  label,
  score: 0,
  confidence: "Low",
  evidenceStatus: "Unverified",
  rationale: "尚未分析。"
});

export function createInitialScoreVector(mode: CaseMode): ScoreDimension[] {
  if (mode === "hiring") {
    return [
      baseDimension("roleFit", "Role Fit"),
      baseDimension("ragArchitecture", "RAG Architecture"),
      baseDimension("retrievalRanking", "Retrieval and Ranking"),
      baseDimension("evaluationExperimentation", "Evaluation and Experimentation"),
      baseDimension("llmAppEngineering", "LLM Application Engineering"),
      baseDimension("deploymentMonitoring", "Deployment and Monitoring"),
      baseDimension("dataEngineering", "Data Engineering"),
      baseDimension("researchDepth", "Research Depth"),
      baseDimension("productJudgment", "Product and Business Judgment"),
      baseDimension("technicalProbeCommunication", "Communication under Technical Probe")
    ];
  }

  return [
    baseDimension("founderMarketFit", "Founder-Market Fit"),
    baseDimension("problemInsight", "Problem Insight"),
    baseDimension("technicalCredibility", "Technical Credibility"),
    baseDimension("aiMoatEvidence", "AI Moat Evidence"),
    baseDimension("executionCapability", "Execution Capability"),
    baseDimension("tractionQuality", "Traction Quality"),
    baseDimension("marketTiming", "Market Timing"),
    baseDimension("businessModelClarity", "Business Model Clarity"),
    baseDimension("competitiveAwareness", "Competitive Awareness"),
    baseDimension("fundabilityNarrative", "Fundability and Next-Round Narrative")
  ];
}
