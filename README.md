# EvidenceOS MVP

EvidenceOS is a lightweight decision workspace for investor diligence and AI/RAG hiring interviews. It turns submitted materials and meeting transcripts into claims, evidence, questions, score vectors, and decision memos.

## Local Run

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`.

## Tests

```powershell
npm test
npm run build
npm run test:e2e
```

## Modes

- Hiring Mode: evaluates AI/RAG candidate evidence against a technical hiring rubric.
- Investor Mode: evaluates AI startup and founder diligence evidence against an investor rubric.

## AI Provider

Default local demos use `AI_PROVIDER=fake`.

For real pilots, configure an OpenAI-compatible provider:

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_CHAT_MODEL=
OPENAI_TRANSCRIBE_MODEL=
```

`OPENAI_BASE_URL` can be set for compatible providers.

## Compliance Boundary

- Audio is used only for transcription and content evidence analysis.
- EvidenceOS does not score emotion, tone, accent, stress, personality, honesty, mental state, micro-expression, age, race, disability, or other protected or sensitive traits.
- Hiring Mode does not automatically reject or hire candidates.
- Investor Mode does not automatically invest or pass.
- Users record the final human decision and override reason.

## Example Materials

- `examples/investor-case.md`
- `examples/hiring-case.md`

## Pilot Playbook

- `docs/pilot-playbook.md`
