import { NextResponse } from "next/server";
import { z } from "zod";
import {
  MATERIAL_SOURCE_URL_MAX_LENGTH,
  MATERIAL_TEXT_MAX_LENGTH,
  MATERIAL_TITLE_MAX_LENGTH,
  extractTextFromMaterialInput
} from "@/lib/materials/extractText";
import { createFileStore } from "@/lib/storage/fileStore";

const httpUrlSchema = z
  .string()
  .trim()
  .url()
  .max(MATERIAL_SOURCE_URL_MAX_LENGTH)
  .refine((value) => {
    try {
      const protocol = new URL(value).protocol;
      return protocol === "http:" || protocol === "https:";
    } catch {
      return false;
    }
  }, "sourceUrl must use http or https");

const materialSchema = z.discriminatedUnion("type", [
  z.object({
    title: z.string().trim().min(2).max(MATERIAL_TITLE_MAX_LENGTH),
    type: z.literal("text"),
    text: z.string().trim().min(1).max(MATERIAL_TEXT_MAX_LENGTH),
    sourceUrl: z.undefined().optional()
  }),
  z.object({
    title: z.string().trim().min(2).max(MATERIAL_TITLE_MAX_LENGTH),
    type: z.literal("note"),
    text: z.string().trim().min(1).max(MATERIAL_TEXT_MAX_LENGTH),
    sourceUrl: z.undefined().optional()
  }),
  z.object({
    title: z.string().trim().min(2).max(MATERIAL_TITLE_MAX_LENGTH),
    type: z.literal("link"),
    text: z.string().trim().min(1).max(MATERIAL_TEXT_MAX_LENGTH),
    sourceUrl: httpUrlSchema
  })
]);

export async function POST(request: Request, { params }: { params: { caseId: string } }) {
  try {
    const store = createFileStore();
    const ledger = await store.getCase(params.caseId);
    const material = await extractTextFromMaterialInput(materialSchema.parse(await request.json()));
    const updated = await store.saveCase({ ...ledger, materials: [...ledger.materials, material] });
    return NextResponse.json({ material, materialCount: updated.materials.length }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid material input." }, { status: 400 });
    }
    if (error instanceof Error && error.message === "Invalid caseId") {
      return NextResponse.json({ error: "Invalid caseId." }, { status: 400 });
    }
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return NextResponse.json({ error: "Case not found." }, { status: 404 });
    }
    if (error instanceof Error && error.message.includes("Material text is required")) {
      return NextResponse.json({ error: "Invalid material input." }, { status: 400 });
    }
    throw error;
  }
}
