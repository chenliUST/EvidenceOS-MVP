"use client";

import { useCallback, useState } from "react";
import { AudioRecorder } from "./AudioRecorder";
import { ClaimEvidenceMatrix } from "./ClaimEvidenceMatrix";
import { DecisionSnapshot } from "./DecisionSnapshot";
import { MaterialIntake } from "./MaterialIntake";
import { MemoPreview } from "./MemoPreview";
import { QuestionPanel } from "./QuestionPanel";
import { ScoreVector } from "./ScoreVector";
import type { EvidenceLedger } from "@/lib/domain/types";

type ActionPath = "analyze" | "questions" | "memo";

export function CaseWorkspace({ caseId, initialLedger }: { caseId: string; initialLedger: EvidenceLedger }) {
  const [ledger, setLedger] = useState<EvidenceLedger>(initialLedger);
  const [busyAction, setBusyAction] = useState<ActionPath | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    const response = await fetch(`/api/cases/${caseId}`);
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.error ?? "Failed to load case.");
    }
    setLedger(json.case);
  }, [caseId]);

  async function run(path: ActionPath) {
    setBusyAction(path);
    setError(null);
    try {
      const response = await fetch(`/api/cases/${caseId}/${path}`, { method: "POST" });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? `Failed to run ${path}.`);
      }
      setLedger(json.case);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : `Failed to run ${path}.`);
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <main className="page-shell workspace-shell">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">{ledger.mode === "hiring" ? "Hiring Mode" : "Investor Mode"}</p>
          <h1>{ledger.title}</h1>
        </div>
        <div className="case-meta">
          <span>{ledger.materials.length} materials</span>
          <span>{ledger.claims.length} claims</span>
          <span>{ledger.questions.length} questions</span>
        </div>
        <div className="actions">
          <button disabled={busyAction !== null} onClick={() => run("analyze")} type="button">
            {busyAction === "analyze" ? "Analyzing..." : "Analyze Evidence"}
          </button>
          <button disabled={busyAction !== null} onClick={() => run("questions")} type="button">
            {busyAction === "questions" ? "Generating..." : "Generate Questions"}
          </button>
          <button disabled={busyAction !== null} onClick={() => run("memo")} type="button">
            {busyAction === "memo" ? "Generating..." : "Generate Memo"}
          </button>
        </div>
        {error ? <p role="alert">{error}</p> : null}
      </header>

      <div className="workspace-grid">
        <div className="workspace-main">
          <DecisionSnapshot ledger={ledger} />
          <ScoreVector ledger={ledger} />
          <ClaimEvidenceMatrix ledger={ledger} />
          <QuestionPanel ledger={ledger} />
          <MemoPreview ledger={ledger} />
        </div>
        <aside className="workspace-side">
          <MaterialIntake caseId={caseId} onAdded={refresh} />
          <AudioRecorder caseId={caseId} onUploaded={refresh} />
        </aside>
      </div>
    </main>
  );
}
