import { NextResponse } from "next/server";
import { z } from "zod";
import { createFileStore } from "@/lib/storage/fileStore";

const createCaseSchema = z.object({
  mode: z.enum(["hiring", "investor"]),
  title: z.string().trim().min(2)
});

export async function GET() {
  const cases = await createFileStore().listCases();
  return NextResponse.json({ cases });
}

export async function POST(request: Request) {
  try {
    const input = createCaseSchema.parse(await request.json());
    const created = await createFileStore().createCase(input);
    return NextResponse.json({ case: created }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid case input." }, { status: 400 });
    }
    throw error;
  }
}
