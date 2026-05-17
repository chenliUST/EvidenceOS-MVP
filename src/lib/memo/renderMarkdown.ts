import type { EvidenceLedger } from "@/lib/domain/types";

export function renderDecisionMemoMarkdown(ledger: EvidenceLedger): string {
  const lines: string[] = [];
  const memo = ledger.memo;

  lines.push(`# ${ledger.title} Decision Memo`);
  lines.push("");
  lines.push(`Mode: ${ledger.mode}`);
  lines.push(`Updated: ${ledger.updatedAt}`);
  lines.push("");

  if (memo) {
    lines.push("## Decision Snapshot");
    lines.push("");
    lines.push(`- Recommendation: ${memo.recommendation}`);
    lines.push(`- Overall Fit Score: ${memo.overallFitScore}`);
    lines.push(`- Evidence Confidence: ${memo.evidenceConfidence}`);
    lines.push(`- Rationale: ${memo.rationale}`);
    lines.push("");
    pushList(lines, "### Top Strengths", memo.topStrengths);
    pushList(lines, "### Top Risks", memo.topRisks);
  }

  lines.push("## Score Vector");
  if (ledger.scoreVector.length === 0) {
    lines.push("- No score vector has been generated yet.");
  } else {
    for (const dimension of ledger.scoreVector) {
      lines.push(
        `- ${dimension.label}: ${dimension.score} / ${dimension.confidence} / ${dimension.evidenceStatus} - ${dimension.rationale}`
      );
    }
  }
  lines.push("");

  lines.push("## Claim-Evidence Matrix");
  if (ledger.claims.length === 0) {
    lines.push("- No claims have been extracted yet.");
  } else {
    for (const claim of ledger.claims) {
      lines.push(`### ${claim.text}`);
      lines.push(`- Importance: ${claim.importance}`);
      lines.push(`- Evidence Status: ${claim.evidenceStatus}`);
      lines.push(`- Risk If False: ${claim.riskIfFalse}`);
      lines.push(`- Verification Question: ${claim.verificationQuestion}`);
      lines.push("");
    }
  }

  if (memo?.nextBestQuestions.length) {
    lines.push("## Next Best Questions");
    for (const question of memo.nextBestQuestions) {
      lines.push(`- ${question.primaryQuestion}`);
      lines.push(`  - Why ask: ${question.whyAsk}`);
      lines.push(`  - Good answer should include: ${question.goodAnswerShouldInclude.join("; ")}`);
      lines.push(`  - Follow-up if vague: ${question.followUpIfVague}`);
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

function pushList(lines: string[], heading: string, items: string[]) {
  lines.push(heading);
  if (items.length === 0) {
    lines.push("- None identified yet.");
  } else {
    for (const item of items) {
      lines.push(`- ${item}`);
    }
  }
  lines.push("");
}
