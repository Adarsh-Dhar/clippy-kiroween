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

// Type alias to avoid conflict with component name
export type ClippyAgentInstance = ClippyAgent;

interface ClippyStatic {
  load(name: string, callback: (agent: ClippyAgent) => void): void;
  agents?: string[];
}

declare global {
  interface Window {
    clippy: ClippyStatic;
    clippyAgent?: ClippyAgent;
    jQuery?: unknown;
    $?: unknown;
  }
}

// Re-export Cortex types for convenience
export type { AnimationTier, MouseQuadrant, UseClippyBrainOptions } from '../hooks/useClippyBrain';
export { TIER } from '../hooks/useClippyBrain';
