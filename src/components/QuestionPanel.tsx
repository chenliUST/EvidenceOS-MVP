import type { EvidenceLedger } from "@/lib/domain/types";

export function QuestionPanel({ ledger }: { ledger: EvidenceLedger }) {
  return (
    <section className="panel">
      <h2>Next Best Questions</h2>
      {ledger.questions.length === 0 ? <p>No questions generated yet.</p> : null}
      {ledger.questions.map((question) => (
        <article className="question" key={question.id}>
          <h3>{question.primaryQuestion}</h3>
          <p>{question.whyAsk}</p>
          <div className="question-detail">
            <span>Good answer: {question.goodAnswerShouldInclude.join("; ")}</span>
            <span>Follow-up: {question.followUpIfVague}</span>
            <span>Red flag: {question.redFlagAnswer}</span>
          </div>
        </article>
      ))}
    </section>
  );
}
