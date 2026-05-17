"use client";

import { useState } from "react";

type IntakeType = "text" | "link" | "note";

export function MaterialIntake({ caseId, onAdded }: { caseId: string; onAdded: () => void }) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [type, setType] = useState<IntakeType>("text");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/cases/${caseId}/materials`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, type, text, sourceUrl: type === "link" ? sourceUrl : undefined })
      });
      if (!response.ok) {
        throw new Error("Failed to add material.");
      }
      setTitle("");
      setText("");
      setSourceUrl("");
      onAdded();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to add material.");
    } finally {
      setIsSaving(false);
    }
  }

  const isDisabled = !title.trim() || !text.trim() || (type === "link" && !sourceUrl.trim()) || isSaving;

  return (
    <section className="panel">
      <h2>Material Intake</h2>
      <label>
        Type
        <select value={type} onChange={(event) => setType(event.target.value as IntakeType)}>
          <option value="text">Text</option>
          <option value="link">Link excerpt</option>
          <option value="note">Note</option>
        </select>
      </label>
      <label>
        Title
        <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} />
      </label>
      <label>
        Source URL
        <input
          value={sourceUrl}
          onChange={(event) => setSourceUrl(event.target.value)}
          type="url"
          maxLength={2048}
          required={type === "link"}
        />
      </label>
      <label>
        Content
        <textarea value={text} onChange={(event) => setText(event.target.value)} rows={8} maxLength={20_000} />
      </label>
      {error ? <p role="alert">{error}</p> : null}
      <button type="button" onClick={submit} disabled={isDisabled}>
        {isSaving ? "Adding..." : "Add Material"}
      </button>
    </section>
  );
}
