import { randomUUID } from "node:crypto";
import type { ClaimAnalysis } from "@/lib/ai/schemas";
import type { Claim, EvidenceItem, EvidenceLedger, ScoreDimension } from "@/lib/domain/types";

export class AnalysisValidationError extends Error {
  constructor(message: string) {
    super(`Analysis output invalid: ${message}`);
    this.name = "AnalysisValidationError";
  }
}

export function applyAnalysisToLedger(ledger: EvidenceLedger, analysis: ClaimAnalysis): EvidenceLedger {
  const materialIds = new Set(ledger.materials.map((material) => material.id));
  const dimensionKeys =
    ledger.scoreVector.length > 0
      ? new Set(ledger.scoreVector.map((dimension) => dimension.key))
      : new Set(analysis.scoreVector.map((dimension) => dimension.key));
  const claimTexts = new Set<string>();

  for (const claim of analysis.claims) {
    if (claimTexts.has(claim.text)) {
      throw new AnalysisValidationError(`duplicate claim text "${claim.text}"`);
    }
    claimTexts.add(claim.text);
    for (const materialId of claim.sourceMaterialIds) {
      if (!materialIds.has(materialId)) {
        throw new AnalysisValidationError(`unknown material "${materialId}"`);
      }
    }
    for (const dimensionKey of claim.affectedDimensions) {
      if (!dimensionKeys.has(dimensionKey)) {
        throw new AnalysisValidationError(`unknown score dimension "${dimensionKey}"`);
      }
    }
  }

  const scoreVector = mergeScoreVector(ledger.scoreVector, analysis.scoreVector);

  const claims: Claim[] = analysis.claims.map((claim) => ({
    id: randomUUID(),
    ...claim
  }));

  const evidence: EvidenceItem[] = analysis.evidence.map((item) => {
    const claim = claims.find((candidate) => candidate.text === item.claimText);
    if (!claim) {
      throw new AnalysisValidationError(`evidence references unknown claim "${item.claimText}"`);
    }
    if (!materialIds.has(item.sourceMaterialId)) {
      throw new AnalysisValidationError(`unknown material "${item.sourceMaterialId}"`);
    }
    return {
      id: randomUUID(),
      claimId: claim.id,
      sourceMaterialId: item.sourceMaterialId,
      summary: item.summary,
      status: item.status,
      impact: item.impact
    };
  });

  return {
    ...ledger,
    claims,
    evidence,
    scoreVector,
    questions: [],
    memo: undefined,
    updatedAt: new Date().toISOString()
  };
}

function mergeScoreVector(current: ScoreDimension[], updates: ScoreDimension[]) {
  if (current.length === 0) {
    return updates;
  }

  const currentKeys = new Set(current.map((dimension) => dimension.key));
  const updateByKey = new Map<string, ScoreDimension>();
  for (const update of updates) {
    if (!currentKeys.has(update.key)) {
      throw new AnalysisValidationError(`unknown score dimension "${update.key}"`);
    }
    updateByKey.set(update.key, update);
  }

  return current.map((dimension) => {
    const update = updateByKey.get(dimension.key);
    if (!update) {
      return dimension;
    }
    return {
      ...dimension,
      ...update,
      key: dimension.key,
      label: dimension.label
    };
  });
}
