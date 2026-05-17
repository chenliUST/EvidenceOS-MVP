import { NextResponse } from "next/server";
import { createDecisionMemo } from "@/lib/memo/createDecisionMemo";
import { createFileStore } from "@/lib/storage/fileStore";

export async function POST(_request: Request, { params }: { params: { caseId: string } }) {
  try {
    const store = createFileStore();
    const ledger = await store.getCase(params.caseId);
    const memo = createDecisionMemo(ledger);
    const updated = await store.saveCase({ ...ledger, memo });
    return NextResponse.json({ case: updated, memo: updated.memo });
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
