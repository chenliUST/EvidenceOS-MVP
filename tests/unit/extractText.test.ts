import { describe, expect, it } from "vitest";
import { extractTextFromMaterialInput } from "@/lib/materials/extractText";

describe("extractTextFromMaterialInput", () => {
  it("preserves plain text input", async () => {
    const result = await extractTextFromMaterialInput({
      title: "Founder notes",
      type: "text",
      text: "We have 12 paying customers and deployed an agentic RAG workflow."
    });

    expect(result.text).toContain("12 paying customers");
    expect(result.type).toBe("text");
    expect(result.title).toBe("Founder notes");
  });

  it("keeps link source metadata with analyzable text", async () => {
    const result = await extractTextFromMaterialInput({
      title: "Company website",
      type: "link",
      sourceUrl: "https://example.com",
      text: "Example company claims production deployments."
    });

    expect(result.text).toContain("production deployments");
    expect(result.sourceUrl).toBe("https://example.com");
  });

  it("rejects empty material text", async () => {
    await expect(
      extractTextFromMaterialInput({
        title: "Empty note",
        type: "note",
        text: "   "
      })
    ).rejects.toThrow("Material text is required");
  });
});
