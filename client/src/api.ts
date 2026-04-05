import type { KeystrokeEvent } from "./types";

const API_BASE_URL = "http://localhost:4000/api";

async function parseJson(response: Response) {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }
  return response.json();
}

export async function startSession(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/sessions/start`, {
    method: "POST"
  });

  const data = (await parseJson(response)) as { sessionId: string };
  return data.sessionId;
}

export async function sendKeystrokes(sessionId: string, events: KeystrokeEvent[]) {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/keystrokes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events })
  });

  return parseJson(response);
}

export async function endSession(sessionId: string) {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/end`, {
    method: "POST"
  });

  return parseJson(response);
}
