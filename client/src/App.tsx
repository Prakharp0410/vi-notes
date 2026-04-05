import { useEffect, useMemo, useRef, useState } from "react";
import { endSession, sendKeystrokes, startSession } from "./api";
import type { KeyClass, KeystrokeEvent } from "./types";

function getKeyClass(event: React.KeyboardEvent<HTMLTextAreaElement>): KeyClass {
  const key = event.key;

  if (key.length === 1) {
    if (/\s/.test(key)) {
      return "whitespace";
    }
    return "printable";
  }

  if (["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(key)) {
    return "modifier";
  }

  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(key)) {
    return "navigation";
  }

  if (["Backspace", "Delete", "Enter", "Tab", "Escape"].includes(key)) {
    return "editing";
  }

  if (["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12"].includes(key)) {
    return "system";
  }

  return "other";
}

export default function App() {
  const [text, setText] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState("Idle");
  const [localCount, setLocalCount] = useState(0);

  const downMapRef = useRef(new Map<string, number>());
  const eventQueueRef = useRef<KeystrokeEvent[]>([]);
  const lastKeydownTsRef = useRef<number | null>(null);

  const flushQueue = async () => {
    if (!sessionId || eventQueueRef.current.length === 0) {
      return;
    }

    const batch = [...eventQueueRef.current];
    eventQueueRef.current = [];

    try {
      await sendKeystrokes(sessionId, batch);
      setStatus(`Tracking (${sessionId})`);
    } catch (error) {
      eventQueueRef.current = [...batch, ...eventQueueRef.current];
      setStatus(`Upload failed: ${(error as Error).message}`);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      void flushQueue();
    }, 2000);

    return () => clearInterval(interval);
  }, [sessionId]);

  const start = async () => {
    try {
      const newSessionId = await startSession();
      setSessionId(newSessionId);
      setStatus(`Tracking (${newSessionId})`);
      setLocalCount(0);
      eventQueueRef.current = [];
      downMapRef.current.clear();
      lastKeydownTsRef.current = null;
    } catch (error) {
      setStatus(`Cannot start session: ${(error as Error).message}`);
    }
  };

  const stop = async () => {
    if (!sessionId) {
      return;
    }

    await flushQueue();

    try {
      await endSession(sessionId);
      setStatus("Session ended");
      setSessionId(null);
      downMapRef.current.clear();
      lastKeydownTsRef.current = null;
    } catch (error) {
      setStatus(`Cannot end session: ${(error as Error).message}`);
    }
  };

  const queueEvent = (event: KeystrokeEvent) => {
    eventQueueRef.current.push(event);
    setLocalCount((count) => count + 1);

    if (eventQueueRef.current.length >= 25) {
      void flushQueue();
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!sessionId) {
      return;
    }

    const now = Date.now();
    const target = event.currentTarget;
    const keyClass = getKeyClass(event);

    const interKeyIntervalMs =
      lastKeydownTsRef.current === null ? undefined : now - lastKeydownTsRef.current;

    lastKeydownTsRef.current = now;
    downMapRef.current.set(event.code, now);

    queueEvent({
      timestamp: new Date(now).toISOString(),
      eventType: "keydown",
      keyClass,
      interKeyIntervalMs,
      isRepeat: event.repeat,
      cursorPosition: target.selectionStart ?? 0,
      selectionLength: (target.selectionEnd ?? 0) - (target.selectionStart ?? 0)
    });
  };

  const onKeyUp = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!sessionId) {
      return;
    }

    const now = Date.now();
    const target = event.currentTarget;
    const keyClass = getKeyClass(event);

    const downTs = downMapRef.current.get(event.code);
    const holdDurationMs = downTs ? now - downTs : undefined;

    downMapRef.current.delete(event.code);

    queueEvent({
      timestamp: new Date(now).toISOString(),
      eventType: "keyup",
      keyClass,
      holdDurationMs,
      isRepeat: event.repeat,
      cursorPosition: target.selectionStart ?? 0,
      selectionLength: (target.selectionEnd ?? 0) - (target.selectionStart ?? 0)
    });
  };

  const avgHold = useMemo(() => {
    const holds = eventQueueRef.current
      .map((item) => item.holdDurationMs)
      .filter((value): value is number => typeof value === "number");

    if (holds.length === 0) {
      return "-";
    }

    const sum = holds.reduce((total, value) => total + value, 0);
    return `${Math.round(sum / holds.length)} ms`;
  }, [localCount]);

  return (
    <div className="page">
      <header className="hero">
        <h1>Vi-Notes</h1>
        <p>Keystroke timing capture for writing authenticity verification.</p>
      </header>

      <section className="controls">
        <button onClick={start} disabled={Boolean(sessionId)}>
          Start Session
        </button>
        <button onClick={stop} disabled={!sessionId}>
          End Session
        </button>
        <span className="status">{status}</span>
      </section>

      <section className="editor">
        <h2>Writing Editor</h2>
        <p>
          Only timing and structural metadata are collected. Raw typed characters are never sent to the backend.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          placeholder="Start a session, then type here..."
        />
      </section>

      <section className="metrics">
        <h3>Live Timing Metrics</h3>
        <div className="grid">
          <div className="card">
            <strong>Total events (local)</strong>
            <span>{localCount}</span>
          </div>
          <div className="card">
            <strong>Queued events</strong>
            <span>{eventQueueRef.current.length}</span>
          </div>
          <div className="card">
            <strong>Average hold duration</strong>
            <span>{avgHold}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
