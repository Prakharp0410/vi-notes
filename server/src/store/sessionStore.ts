import { randomUUID } from "crypto";
import type { KeystrokeEvent, WritingSession } from "../types";

const sessions = new Map<string, WritingSession>();

export function createSession(): WritingSession {
  const id = randomUUID();
  const session: WritingSession = {
    id,
    startedAt: new Date().toISOString(),
    eventCount: 0,
    keystrokeEvents: []
  };

  sessions.set(id, session);
  return session;
}

export function getSession(sessionId: string): WritingSession | undefined {
  return sessions.get(sessionId);
}

export function appendKeystrokes(sessionId: string, events: KeystrokeEvent[]): WritingSession | undefined {
  const session = sessions.get(sessionId);
  if (!session) {
    return undefined;
  }

  session.keystrokeEvents.push(...events);
  session.eventCount += events.length;
  return session;
}

export function endSession(sessionId: string): WritingSession | undefined {
  const session = sessions.get(sessionId);
  if (!session) {
    return undefined;
  }

  session.endedAt = new Date().toISOString();
  return session;
}

export function listSessions(): Pick<WritingSession, "id" | "startedAt" | "endedAt" | "eventCount">[] {
  return [...sessions.values()].map((session) => ({
    id: session.id,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    eventCount: session.eventCount
  }));
}
