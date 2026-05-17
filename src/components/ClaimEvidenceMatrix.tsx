import type { EvidenceLedger } from "@/lib/domain/types";

export function ClaimEvidenceMatrix({ ledger }: { ledger: EvidenceLedger }) {
  return (
    <section className="panel">
      <h2>Claim-Evidence Matrix</h2>
      {ledger.claims.length === 0 ? <p>No claims extracted yet.</p> : null}
      {ledger.claims.map((claim) => {
        const evidenceCount = ledger.evidence.filter((item) => item.claimId === claim.id).length;
        return (
          <article className="matrix-row" key={claim.id}>
            <div>
              <h3>{claim.text}</h3>
              <p>{claim.riskIfFalse}</p>
            </div>
            <span>{claim.importance}</span>
            <span>{claim.evidenceStatus}</span>
            <span>{evidenceCount} evidence</span>
            <p className="matrix-question">{claim.verificationQuestion}</p>
          </article>
        );
      })}
    </section>
  );
}
