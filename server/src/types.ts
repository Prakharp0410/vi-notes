export type KeyClass =
  | "printable"
  | "whitespace"
  | "modifier"
  | "navigation"
  | "editing"
  | "system"
  | "other";

export type KeystrokeEvent = {
  timestamp: string;
  eventType: "keydown" | "keyup";
  keyClass: KeyClass;
  interKeyIntervalMs?: number;
  holdDurationMs?: number;
  isRepeat: boolean;
  cursorPosition: number;
  selectionLength: number;
};
      
export type WritingSession = {
  id: string;
  startedAt: string;
  endedAt?: string;
  eventCount: number;
  keystrokeEvents: KeystrokeEvent[];
};
