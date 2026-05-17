import { NextResponse } from "next/server";
import { AiProviderError, createAiProvider } from "@/lib/ai/provider";
import { AnalysisValidationError, applyAnalysisToLedger } from "@/lib/domain/ledger";
import { createFileStore } from "@/lib/storage/fileStore";

export async function POST(_request: Request, { params }: { params: { caseId: string } }) {
  try {
    const store = createFileStore();
    const ledger = await store.getCase(params.caseId);
    const analysis = await createAiProvider().analyzeClaims(ledger);
    const updated = await store.saveCase(applyAnalysisToLedger(ledger, analysis));
    return NextResponse.json({ case: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid caseId") {
      return NextResponse.json({ error: "Invalid caseId." }, { status: 400 });
    }
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return NextResponse.json({ error: "Case not found." }, { status: 404 });
    }
    if (error instanceof AiProviderError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof AnalysisValidationError) {
      return NextResponse.json({ error: "AI analysis could not be applied." }, { status: 502 });
    }
    throw error;
  }
}
