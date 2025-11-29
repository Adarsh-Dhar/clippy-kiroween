// Type declarations for Clippy.js library

interface ClippyAgent {
  show(): void;
  hide(): void;
  play(animation: string, timeout?: number, callback?: () => void): void;
  animate(): void;
  speak(text: string): void;
  moveTo(x: number, y: number, duration?: number): void;
  gestureAt(x: number, y: number): void;
  stopCurrent(): void;
}

interface ClippyStatic {
  load(name: string, callback: (agent: ClippyAgent) => void): void;
}

interface Window {
  clippy: ClippyStatic;
}
