"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CaseMode } from "@/lib/domain/types";

export default function HomePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<CaseMode>("investor");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createCase() {
    setIsCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/cases", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, mode })
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error ?? "Failed to create case.");
      }
      router.push(`/cases/${json.case.caseId}`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create case.");
      setIsCreating(false);
    }
  }

  return (
    <main className="page-shell home-shell">
      <section className="hero">
        <p className="eyebrow">EvidenceOS Meeting Copilot</p>
        <h1>Decision-grade evidence workspace</h1>
        <p className="hero-copy">
          Create a hiring or investor case, add materials and audio, then generate evidence-backed questions, scores,
          and memos.
        </p>
      </section>

      <section className="panel home-create">
        <h2>Create Case</h2>
        <label>
          Case Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} />
        </label>
        <label>
          Mode
          <select value={mode} onChange={(event) => setMode(event.target.value as CaseMode)}>
            <option value="investor">Investor Mode</option>
            <option value="hiring">Hiring Mode</option>
          </select>
        </label>
        {error ? <p role="alert">{error}</p> : null}
        <button disabled={!title.trim() || isCreating} onClick={createCase} type="button">
          {isCreating ? "Creating..." : "Create Case"}
        </button>
      </section>
    </main>
  );
}
