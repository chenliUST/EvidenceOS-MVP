import { describe, expect, it } from "vitest";
import { createPilotEvent } from "@/lib/pilot/metrics";

describe("createPilotEvent", () => {
  it("creates an auditable pilot event", () => {
    const event = createPilotEvent({ caseId: "case-1", type: "question_used", payload: { questionId: "q1" } });

    expect(event.id).toBeTruthy();
    expect(event.caseId).toBe("case-1");
    expect(event.type).toBe("question_used");
    expect(event.createdAt).toMatch(/^20/);
  });
});
