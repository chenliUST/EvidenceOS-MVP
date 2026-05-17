import { describe, expect, it } from "vitest";
import { TranscriptionProviderError, createFakeTranscriber, createTranscriber } from "@/lib/audio/transcription";

describe("createFakeTranscriber", () => {
  it("turns placeholder audio into a transcript segment", async () => {
    const segments = await createFakeTranscriber().transcribe(Buffer.from("audio"));

    expect(segments[0].speaker).toBe("Unknown");
    expect(segments[0].text).toContain("Fake transcript");
  });
});

describe("createTranscriber", () => {
  it("requires model and API key for the real provider", () => {
    const previousProvider = process.env.AI_PROVIDER;
    const previousApiKey = process.env.OPENAI_API_KEY;
    const previousModel = process.env.OPENAI_TRANSCRIBE_MODEL;
    process.env.AI_PROVIDER = "openai";
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_TRANSCRIBE_MODEL;

    try {
      expect(() => createTranscriber()).toThrow(TranscriptionProviderError);
    } finally {
      restoreEnv("AI_PROVIDER", previousProvider);
      restoreEnv("OPENAI_API_KEY", previousApiKey);
      restoreEnv("OPENAI_TRANSCRIBE_MODEL", previousModel);
    }
  });
});

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}
