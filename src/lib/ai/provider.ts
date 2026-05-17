import { evidenceAnalysisSystemPrompt } from "./prompts";
import { claimAnalysisSchema, type ClaimAnalysis } from "./schemas";
import type { EvidenceLedger } from "@/lib/domain/types";

export interface AiProvider {
  analyzeClaims(ledger: EvidenceLedger): Promise<ClaimAnalysis>;
}

export class AiProviderError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 502
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}

export const MAX_ANALYSIS_MATERIALS = 25;
export const MAX_ANALYSIS_TEXT_PER_MATERIAL = 4_000;
export const MAX_ANALYSIS_TOTAL_TEXT = 12_000;

const analysisResponseContract = {
  claims:
    "Array of decision-relevant claims. Each claim must cite sourceMaterialIds from the provided materials and affectedDimensions from the provided scoreVector.",
  evidence:
    "Array of evidence items. claimText must exactly match one claim.text. sourceMaterialId must be one provided material id.",
  scoreVector:
    "Array of score updates. Use only scoreVector keys provided in the input. Scores are 0-100; confidence is High, Medium, Low, or Conflicted."
};

export function createAiProvider(): AiProvider {
  const provider = process.env.AI_PROVIDER;
  if (provider === "fake" || !provider) {
    return createFakeAiProvider();
  }
  if (provider === "openai" || provider === "openai-compatible") {
    return createOpenAiCompatibleProvider();
  }
  throw new AiProviderError(`Unsupported AI_PROVIDER "${provider}".`, 400);
}

export function buildAnalysisPayload(ledger: EvidenceLedger) {
  let remainingTextBudget = MAX_ANALYSIS_TOTAL_TEXT;

  const materials = ledger.materials.slice(0, MAX_ANALYSIS_MATERIALS).map((material) => {
    const textLength = Math.max(0, Math.min(material.text.length, MAX_ANALYSIS_TEXT_PER_MATERIAL, remainingTextBudget));
    remainingTextBudget -= textLength;
    return {
      id: material.id,
      type: material.type,
      title: material.title,
      sourceUrl: material.sourceUrl,
      text: material.text.slice(0, textLength)
    };
  });

  return {
    mode: ledger.mode,
    title: ledger.title,
    materials,
    scoreVector: ledger.scoreVector.map((dimension) => ({
      key: dimension.key,
      label: dimension.label,
      score: dimension.score,
      confidence: dimension.confidence,
      evidenceStatus: dimension.evidenceStatus,
      rationale: dimension.rationale
    }))
  };
}

function createFakeAiProvider(): AiProvider {
  return {
    async analyzeClaims(ledger) {
      const firstMaterial = ledger.materials[0];
      const claimText = `${ledger.title} has decision-relevant claims in submitted materials.`;
      return {
        claims: [
          {
            text: claimText,
            importance: "High",
            evidenceStatus: firstMaterial ? "Partially Supported" : "Unverified",
            sourceMaterialIds: firstMaterial ? [firstMaterial.id] : [],
            riskIfFalse: "The case may be relying on unsupported narrative.",
            verificationQuestion: "What direct evidence proves the strongest claim in the submitted materials?",
            affectedDimensions: ledger.scoreVector.slice(0, 2).map((dimension) => dimension.key)
          }
        ],
        evidence: firstMaterial
          ? [
              {
                claimText,
                sourceMaterialId: firstMaterial.id,
                summary: firstMaterial.text.slice(0, 180),
                status: "Partially Supported",
                impact: "Raises Confidence"
              }
            ]
          : [],
        scoreVector: ledger.scoreVector.map((dimension, index) => ({
          ...dimension,
          score: index < 2 ? 62 : 48,
          confidence: index < 2 ? "Medium" : "Low",
          evidenceStatus: index < 2 ? "Partially Supported" : "Unverified",
          rationale: index < 2 ? "Submitted material gives partial support." : "No direct evidence yet."
        }))
      };
    }
  };
}

function createOpenAiCompatibleProvider(): AiProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_CHAT_MODEL;
  const baseUrl = (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/+$/, "");

  if (!apiKey || !model) {
    throw new AiProviderError("AI provider is not configured. Set OPENAI_API_KEY and OPENAI_CHAT_MODEL.", 400);
  }

  return {
    async analyzeClaims(ledger) {
      let response: Response;
      try {
        response = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            temperature: 0.2,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: evidenceAnalysisSystemPrompt },
              {
                role: "user",
                content: JSON.stringify({
                  contract: analysisResponseContract,
                  input: buildAnalysisPayload(ledger)
                })
              }
            ]
          })
        });
      } catch {
        throw new AiProviderError("AI provider request failed.");
      }

      if (!response.ok) {
        throw new AiProviderError(`AI provider failed with status ${response.status}.`);
      }

      let json: unknown;
      try {
        json = await response.json();
      } catch {
        throw new AiProviderError("AI provider returned invalid JSON envelope.");
      }
      const jsonEnvelope = json as { choices?: Array<{ message?: { content?: unknown } }> };
      const content = jsonEnvelope.choices?.[0]?.message?.content;
      if (typeof content !== "string") {
        throw new AiProviderError("AI provider returned no message content.");
      }

      let parsedContent: unknown;
      try {
        parsedContent = JSON.parse(content);
      } catch {
        throw new AiProviderError("AI provider returned invalid analysis JSON.");
      }

      const analysis = claimAnalysisSchema.safeParse(parsedContent);
      if (!analysis.success) {
        throw new AiProviderError("AI provider returned analysis outside the expected schema.");
      }
      return analysis.data;
    }
  };
}
