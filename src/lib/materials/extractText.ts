import { randomUUID } from "node:crypto";
import type { Material } from "@/lib/domain/types";

export const MATERIAL_TITLE_MAX_LENGTH = 120;
export const MATERIAL_TEXT_MAX_LENGTH = 20_000;
export const MATERIAL_SOURCE_URL_MAX_LENGTH = 2_048;

export type SupportedMaterialInputType = "text" | "link" | "note";

export interface MaterialInput {
  title: string;
  type: SupportedMaterialInputType;
  text?: string;
  sourceUrl?: string;
}

export async function extractTextFromMaterialInput(input: MaterialInput): Promise<Material> {
  const title = input.title.trim();
  const text = (input.text ?? "").trim();
  const sourceUrl = input.sourceUrl?.trim();
  if (!title) {
    throw new Error("Material title is required for MVP ingestion.");
  }
  if (title.length > MATERIAL_TITLE_MAX_LENGTH) {
    throw new Error("Material title exceeds MVP ingestion limit.");
  }
  if (!text) {
    throw new Error("Material text is required for MVP ingestion.");
  }
  if (text.length > MATERIAL_TEXT_MAX_LENGTH) {
    throw new Error("Material text exceeds MVP ingestion limit.");
  }
  if (sourceUrl && sourceUrl.length > MATERIAL_SOURCE_URL_MAX_LENGTH) {
    throw new Error("Material source URL exceeds MVP ingestion limit.");
  }

  return {
    id: randomUUID(),
    title,
    type: input.type,
    sourceUrl,
    text,
    createdAt: new Date().toISOString()
  };
}
