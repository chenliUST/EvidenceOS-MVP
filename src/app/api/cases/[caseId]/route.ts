import { NextResponse } from "next/server";
import { createFileStore } from "@/lib/storage/fileStore";

export async function GET(_request: Request, { params }: { params: { caseId: string } }) {
  try {
    const ledger = await createFileStore().getCase(params.caseId);
    return NextResponse.json({ case: ledger });
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
