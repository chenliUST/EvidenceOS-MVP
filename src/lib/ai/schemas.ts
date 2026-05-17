import { z } from "zod";

const evidenceStatusSchema = z.enum([
  "Strongly Supported",
  "Partially Supported",
  "Weakly Supported",
  "Unverified",
  "Contradictory"
]);

export const claimAnalysisSchema = z.object({
  claims: z.array(
    z.object({
      text: z.string().min(1).max(500),
      importance: z.enum(["High", "Medium", "Low"]),
      evidenceStatus: evidenceStatusSchema,
      sourceMaterialIds: z.array(z.string().min(1)).max(10),
      riskIfFalse: z.string().min(1).max(500),
      verificationQuestion: z.string().min(1).max(500),
      affectedDimensions: z.array(z.string().min(1)).max(8)
    })
  ).max(20),
  evidence: z.array(
    z.object({
      claimText: z.string().min(1).max(500),
      sourceMaterialId: z.string().min(1),
      summary: z.string().min(1).max(500),
      status: evidenceStatusSchema,
      impact: z.enum(["Raises Score", "Lowers Score", "Raises Confidence", "Lowers Confidence", "Neutral"])
    })
  ).max(40),
  scoreVector: z.array(
    z.object({
      key: z.string().min(1),
      label: z.string().min(1).max(120),
      score: z.number().min(0).max(100),
      confidence: z.enum(["High", "Medium", "Low", "Conflicted"]),
      evidenceStatus: evidenceStatusSchema,
      rationale: z.string().min(1).max(500)
    })
  ).max(16)
});

export type ClaimAnalysis = z.infer<typeof claimAnalysisSchema>;
