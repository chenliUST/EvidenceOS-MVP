import { randomUUID } from "node:crypto";
import type { TranscriptSegment } from "@/lib/domain/types";

export interface Transcriber {
  transcribe(audio: Buffer): Promise<TranscriptSegment[]>;
}

export class TranscriptionProviderError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 502
  ) {
    super(message);
    this.name = "TranscriptionProviderError";
  }
}

export function createTranscriber(): Transcriber {
  const provider = process.env.AI_PROVIDER;
  if (provider === "fake" || !provider) {
    return createFakeTranscriber();
  }
  if (provider === "openai" || provider === "openai-compatible") {
    return createOpenAiCompatibleTranscriber();
  }
  throw new TranscriptionProviderError(`Unsupported AI_PROVIDER "${provider}".`, 400);
}

export function createFakeTranscriber(): Transcriber {
  return {
    async transcribe() {
      return [
        {
          id: randomUUID(),
          speaker: "Unknown",
          text: "Fake transcript: founder claims the product has production deployments and measurable customer traction."
        }
      ];
    }
  };
}

function createOpenAiCompatibleTranscriber(): Transcriber {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_TRANSCRIBE_MODEL;
  const baseUrl = (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/+$/, "");

  if (!apiKey || !model) {
    throw new TranscriptionProviderError(
      "Transcription provider is not configured. Set OPENAI_API_KEY and OPENAI_TRANSCRIBE_MODEL.",
      400
    );
  }

  return {
    async transcribe(audio) {
      const form = new FormData();
      const bytes = new Uint8Array(audio.byteLength);
      bytes.set(audio);
      form.append("model", model);
      form.append("file", new Blob([bytes]), "meeting.webm");

      let response: Response;
      try {
        response = await fetch(`${baseUrl}/audio/transcriptions`, {
          method: "POST",
          headers: {
            authorization: `Bearer ${apiKey}`
          },
          body: form
        });
      } catch {
        throw new TranscriptionProviderError("Transcription provider request failed.");
      }

      if (!response.ok) {
        throw new TranscriptionProviderError(`Transcription provider failed with status ${response.status}.`);
      }

      let json: unknown;
      try {
        json = await response.json();
      } catch {
        throw new TranscriptionProviderError("Transcription provider returned invalid JSON.");
      }

      const text = (json as { text?: unknown }).text;
      if (typeof text !== "string" || text.trim().length === 0) {
        throw new TranscriptionProviderError("Transcription provider returned empty text.");
      }

      return [
        {
          id: randomUUID(),
          speaker: "Unknown",
          text: text.trim()
        }
      ];
    }
  };
}
