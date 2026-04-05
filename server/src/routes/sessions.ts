import { Router } from "express";
import {
  appendKeystrokes,
  createSession,
  endSession,
  getSession,
  listSessions
} from "../store/sessionStore";
import type { KeystrokeEvent } from "../types";

const router = Router();

const allowedKeyClasses = new Set([
  "printable",
  "whitespace",
  "modifier",
  "navigation",
  "editing",
  "system",
  "other"
]);

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidEvent(event: unknown): event is KeystrokeEvent {
  if (typeof event !== "object" || event === null) {
    return false;
  }

  const candidate = event as Record<string, unknown>;

  if (typeof candidate.timestamp !== "string") {
    return false;
  }

  if (candidate.eventType !== "keydown" && candidate.eventType !== "keyup") {
    return false;
  }

  if (!allowedKeyClasses.has(String(candidate.keyClass))) {
    return false;
  }

  if (typeof candidate.isRepeat !== "boolean") {
    return false;
  }

  if (!isFiniteNumber(candidate.cursorPosition) || !isFiniteNumber(candidate.selectionLength)) {
    return false;
  }

  if (
    candidate.interKeyIntervalMs !== undefined &&
    !isFiniteNumber(candidate.interKeyIntervalMs)
  ) {
    return false;
  }

  if (candidate.holdDurationMs !== undefined && !isFiniteNumber(candidate.holdDurationMs)) {
    return false;
  }

  return true;
}

router.post("/start", (_req, res) => {
  const session = createSession();

  res.status(201).json({
    sessionId: session.id
  });
});

router.get("/", (_req, res) => {
  res.status(200).json({ sessions: listSessions() });
});

router.post("/:sessionId/keystrokes", (req, res) => {
  const { sessionId } = req.params;
  const { events } = req.body as { events?: KeystrokeEvent[] };

  if (!Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ error: "events must be a non-empty array" });
  }

  if (events.length > 1000) {
    return res.status(400).json({ error: "batch too large" });
  }

  if (!events.every((event) => isValidEvent(event))) {
    return res.status(400).json({ error: "Invalid keystroke event payload" });
  }

  const updateResult = appendKeystrokes(sessionId, events);

  if (!updateResult) {
    return res.status(404).json({ error: "Session not found" });
  }

  return res.status(200).json({
    sessionId,
    eventCount: updateResult.eventCount
  });
});

router.post("/:sessionId/end", (req, res) => {
  const { sessionId } = req.params;

  const session = endSession(sessionId);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  return res.status(200).json({
    sessionId,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    eventCount: session.eventCount
  });
});

router.get("/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const session = getSession(sessionId);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  return res.status(200).json(session);
});

export default router;
