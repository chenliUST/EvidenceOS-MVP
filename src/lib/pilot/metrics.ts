import { randomUUID } from "node:crypto";

export type PilotEventType =
  | "memo_opened"
  | "question_used"
  | "question_skipped"
  | "recommendation_changed"
  | "human_decision_recorded";

export interface PilotEventInput {
  caseId: string;
  type: PilotEventType;
  payload: Record<string, unknown>;
}

export interface PilotEvent extends PilotEventInput {
  id: string;
  createdAt: string;
}

export function createPilotEvent(input: PilotEventInput): PilotEvent {
  return {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...input
  };
}
