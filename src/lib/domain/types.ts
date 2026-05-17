export type CaseMode = "hiring" | "investor";

export type EvidenceStatus =
  | "Strongly Supported"
  | "Partially Supported"
  | "Weakly Supported"
  | "Unverified"
  | "Contradictory";

export type EvidenceConfidenceLabel = "High" | "Medium" | "Low" | "Conflicted";

export type DecisionRecommendation =
  | "Strong Proceed"
  | "Proceed with Verification"
  | "Hold"
  | "Do Not Proceed Based on Current Evidence";

export type MaterialType = "text" | "link" | "pdf" | "docx" | "audio" | "transcript" | "note";

export interface Material {
  id: string;
  type: MaterialType;
  title: string;
  sourceUrl?: string;
  text: string;
  createdAt: string;
}

export interface Claim {
  id: string;
  text: string;
  importance: "High" | "Medium" | "Low";
  evidenceStatus: EvidenceStatus;
  sourceMaterialIds: string[];
  riskIfFalse: string;
  verificationQuestion: string;
  affectedDimensions: string[];
}

export interface EvidenceItem {
  id: string;
  claimId: string;
  sourceMaterialId: string;
  summary: string;
  status: EvidenceStatus;
  impact: "Raises Score" | "Lowers Score" | "Raises Confidence" | "Lowers Confidence" | "Neutral";
}

export interface ScoreDimension {
  key: string;
  label: string;
  score: number;
  confidence: EvidenceConfidenceLabel;
  evidenceStatus: EvidenceStatus;
  rationale: string;
}

export interface Question {
  id: string;
  primaryQuestion: string;
  whyAsk: string;
  goodAnswerShouldInclude: string[];
  followUpIfVague: string;
  redFlagAnswer: string;
  affectedDimensions: string[];
}

export interface TranscriptSegment {
  id: string;
  speaker: "Investor" | "Founder" | "Interviewer" | "Candidate" | "Unknown";
  text: string;
  startedAtSeconds?: number;
  endedAtSeconds?: number;
}

export interface DecisionMemo {
  recommendation: DecisionRecommendation;
  overallFitScore: number;
  evidenceConfidence: number;
  topStrengths: string[];
  topRisks: string[];
  nextBestQuestions: Question[];
  rationale: string;
  markdown: string;
}

export interface PilotEvent {
  id: string;
  caseId: string;
  type: "memo_opened" | "question_used" | "question_skipped" | "recommendation_changed" | "human_decision_recorded";
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface EvidenceLedger {
  caseId: string;
  mode: CaseMode;
  title: string;
  materials: Material[];
  claims: Claim[];
  evidence: EvidenceItem[];
  scoreVector: ScoreDimension[];
  questions: Question[];
  transcriptSegments: TranscriptSegment[];
  memo?: DecisionMemo;
  pilotEvents?: PilotEvent[];
  humanDecision?: {
    decision: "Proceed" | "Hold" | "Pass" | "Hire" | "Reject" | "Invest" | "No Invest";
    overrideReason: string;
    createdAt: string;
  };
  createdAt: string;
  updatedAt: string;
}
