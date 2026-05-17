import type { EvidenceLedger } from "@/lib/domain/types";

export function DecisionSnapshot({ ledger }: { ledger: EvidenceLedger }) {
  const memo = ledger.memo;

  return (
    <section className="panel decision-panel">
      <div>
        <h2>Decision Snapshot</h2>
        {memo ? <p>{memo.rationale}</p> : <p>No decision memo yet.</p>}
      </div>
      <div className="decision-metrics">
        <Metric label="Recommendation" value={memo?.recommendation ?? "Pending"} />
        <Metric label="Overall Fit" value={memo ? String(memo.overallFitScore) : "-"} />
        <Metric label="Evidence Confidence" value={memo ? String(memo.evidenceConfidence) : "-"} />
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
