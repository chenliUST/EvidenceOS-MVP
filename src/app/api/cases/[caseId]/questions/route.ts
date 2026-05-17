import { NextResponse } from "next/server";
import { generateQuestionsFromLedger } from "@/lib/domain/questions";
import { createFileStore } from "@/lib/storage/fileStore";

export async function POST(_request: Request, { params }: { params: { caseId: string } }) {
  try {
    const store = createFileStore();
    const ledger = await store.getCase(params.caseId);
    const questions = generateQuestionsFromLedger(ledger);
    const updated = await store.saveCase({ ...ledger, questions, memo: undefined });
    return NextResponse.json({ case: updated, questions });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid caseId") {
      return NextResponse.json({ error: "Invalid caseId." }, { status: 400 });
    }
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return NextResponse.json({ error: "Case not found." }, { status: 404 });
    }
    throw error;
  }
}
