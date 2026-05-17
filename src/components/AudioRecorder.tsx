"use client";

import { useRef, useState } from "react";

export function AudioRecorder({ caseId, onUploaded }: { caseId: string; onUploaded: () => void }) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setError(null);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };
    recorder.onstop = () => {
      void uploadRecording();
    };
    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  }

  function stop() {
    recorderRef.current?.stop();
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    setRecording(false);
  }

  async function uploadRecording() {
    setUploading(true);
    setError(null);
    try {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("audio", blob, "meeting.webm");
      const response = await fetch(`/api/cases/${caseId}/audio`, { method: "POST", body: formData });
      if (!response.ok) {
        throw new Error("Failed to upload audio.");
      }
      onUploaded();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Failed to upload audio.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="panel">
      <h2>Meeting Audio</h2>
      <p>Record only after the participant has consented.</p>
      {recording ? (
        <button onClick={stop} type="button">
          Stop and Upload
        </button>
      ) : (
        <button disabled={uploading} onClick={start} type="button">
          {uploading ? "Uploading..." : "Start Recording"}
        </button>
      )}
      {error ? <p role="alert">{error}</p> : null}
    </section>
  );
}
