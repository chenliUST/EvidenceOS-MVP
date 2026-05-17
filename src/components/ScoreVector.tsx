import type { EvidenceLedger } from "@/lib/domain/types";

export function ScoreVector({ ledger }: { ledger: EvidenceLedger }) {
  return (
    <section className="panel">
      <h2>Score Vector</h2>
      <div className="score-table">
        {ledger.scoreVector.map((dimension) => (
          <div className="score-row" key={dimension.key}>
            <div>
              <strong>{dimension.label}</strong>
              <p>{dimension.rationale}</p>
            </div>
            <span className="score-number">{dimension.score}</span>
            <span>{dimension.confidence}</span>
            <span>{dimension.evidenceStatus}</span>
            <div className="score-meter" aria-hidden="true">
              <span style={{ width: `${dimension.score}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
