# EvidenceOS Pilot Playbook

## Pilot Boundary

EvidenceOS uses submitted materials and meeting content to analyze claims, evidence, questions, scores, confidence, and decision memos.

EvidenceOS does not score emotion, tone, accent, stress, personality, honesty, mental state, micro-expression, age, race, disability, or other protected or sensitive traits.

## Consent

Before recording audio, the pilot user must inform meeting participants that audio will be recorded and transcribed for note-taking and content evidence analysis.

## VC Pilot

- Duration: 30 days.
- Volume: 10 AI startup cases.
- Inputs: deck notes, website excerpts, founder call audio or transcript, investor notes.
- Outputs: pre-meeting evidence memo, next-question panel, post-meeting memo, final human decision and override reason.

## Portfolio Hiring Pilot

- Duration: 30 days.
- Volume: 20 AI/RAG candidate cases.
- Inputs: JD, resume, candidate materials, code or blog excerpts, optional interview audio.
- Outputs: question plan, claim-evidence matrix, score vector, post-interview memo, final human decision and override reason.

## Success Signals

- User opens the memo before the meeting.
- User asks at least one suggested question.
- Recommendation or confidence changes after meeting evidence is added.
- User records a final decision and reason.
- User asks to process the next batch of cases.

## Demo Script

1. Create an Investor Mode case named `Acme AI Seed`.
2. Paste `examples/investor-case.md` into Material Intake.
3. Run `Analyze Evidence`.
4. Run `Generate Questions`.
5. Upload or fake-transcribe meeting audio.
6. Run `Analyze Evidence` again.
7. Run `Generate Memo`.
8. Record the final human decision and override reason through the decision API or a pilot script.
