import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { TranscriptionProviderError, createTranscriber } from "@/lib/audio/transcription";
import { createFileStore } from "@/lib/storage/fileStore";

const maxAudioBytes = 20 * 1024 * 1024;

export async function POST(request: Request, { params }: { params: { caseId: string } }) {
  try {
    const store = createFileStore();
    const ledger = await store.getCase(params.caseId);
    const formData = await request.formData();
    const file = formData.get("audio");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Audio file is required." }, { status: 400 });
    }
    if (file.size === 0 || file.size > maxAudioBytes) {
      return NextResponse.json({ error: "Audio file size is invalid." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const segments = await createTranscriber().transcribe(buffer);
    const transcriptText = segments.map((segment) => `${segment.speaker}: ${segment.text}`).join("\n");
    const timestamp = new Date().toISOString();
    const material = {
      id: randomUUID(),
      type: "transcript" as const,
      title: `Transcript ${timestamp}`,
      text: transcriptText,
      createdAt: timestamp
    };

    const updated = await store.saveCase({
      ...ledger,
      materials: [...ledger.materials, material],
      transcriptSegments: [...ledger.transcriptSegments, ...segments],
      memo: undefined
    });

    return NextResponse.json({ case: updated, transcriptSegments: segments }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid caseId") {
      return NextResponse.json({ error: "Invalid caseId." }, { status: 400 });
    }
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return NextResponse.json({ error: "Case not found." }, { status: 404 });
    }
    if (error instanceof TranscriptionProviderError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    throw error;
  }
}
