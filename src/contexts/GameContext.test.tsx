import { describe, it, expect } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';
import { GameProvider, useGame } from './GameContext';

describe('GameContext', () => {
  it('should initialize with PLAYING state and anger level 0', () => {
    const { result } = renderHook(() => useGame(), {
      wrapper: GameProvider,
    });

    expect(result.current.gameState).toBe('PLAYING');
    expect(result.current.angerLevel).toBe(0);
    expect(result.current.errorCount).toBe(0);
  });

  it('should update anger level when setAngerLevel is called', () => {
    const { result } = renderHook(() => useGame(), {
      wrapper: GameProvider,
    });

    act(() => {
      result.current.setAngerLevel(3);
    });

    expect(result.current.angerLevel).toBe(3);
  });

  it('should automatically transition to CRASHED when anger level reaches 5', () => {
    const { result } = renderHook(() => useGame(), {
      wrapper: GameProvider,
    });

    act(() => {
      result.current.setAngerLevel(5);
    });

    expect(result.current.gameState).toBe('CRASHED');
  });

  it('should transition to CRASHED when triggerCrash is called', () => {
    const { result } = renderHook(() => useGame(), {
      wrapper: GameProvider,
    });

    act(() => {
      result.current.triggerCrash();
    });

    expect(result.current.gameState).toBe('CRASHED');
  });

  it('should update error count when setErrorCount is called', () => {
    const { result } = renderHook(() => useGame(), {
      wrapper: GameProvider,
    });

    act(() => {
      result.current.setErrorCount(5);
    });

    expect(result.current.errorCount).toBe(5);
  });

  it('should remain CRASHED after multiple crash triggers', () => {
    const { result } = renderHook(() => useGame(), {
      wrapper: GameProvider,
    });

    act(() => {
      result.current.triggerCrash();
    });

    expect(result.current.gameState).toBe('CRASHED');

    act(() => {
      result.current.triggerCrash();
    });

    expect(result.current.gameState).toBe('CRASHED');
  });
});
