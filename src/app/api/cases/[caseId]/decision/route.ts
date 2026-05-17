import { NextResponse } from "next/server";
import { z } from "zod";
import { createPilotEvent } from "@/lib/pilot/metrics";
import { createFileStore } from "@/lib/storage/fileStore";

const decisionSchema = z.object({
  decision: z.enum(["Proceed", "Hold", "Pass", "Hire", "Reject", "Invest", "No Invest"]),
  overrideReason: z.string().trim().min(1).max(1_000)
});

export async function POST(request: Request, { params }: { params: { caseId: string } }) {
  try {
    const input = decisionSchema.parse(await request.json());
    const store = createFileStore();
    const ledger = await store.getCase(params.caseId);
    const humanDecision = {
      ...input,
      createdAt: new Date().toISOString()
    };
    const event = createPilotEvent({
      caseId: ledger.caseId,
      type: "human_decision_recorded",
      payload: {
        decision: input.decision,
        hasMemo: Boolean(ledger.memo),
        memoRecommendation: ledger.memo?.recommendation
      }
    });

    const updated = await store.saveCase({
      ...ledger,
      humanDecision,
      pilotEvents: [...(ledger.pilotEvents ?? []), event]
    });
    return NextResponse.json({ case: updated, event });
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid decision input." }, { status: 400 });
    }
    if (error instanceof Error && error.message === "Invalid caseId") {
      return NextResponse.json({ error: "Invalid caseId." }, { status: 400 });
    }
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return NextResponse.json({ error: "Case not found." }, { status: 404 });
    }
    throw error;
  }
}
