import type { EvidenceLedger } from "@/lib/domain/types";

export function MemoPreview({ ledger }: { ledger: EvidenceLedger }) {
  return (
    <section className="panel">
      <h2>Decision Memo</h2>
      <pre className="memo">{ledger.memo?.markdown ?? "No memo generated yet."}</pre>
    </section>
  );
}
