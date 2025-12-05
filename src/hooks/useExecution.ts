import { useCallback } from 'react';
import { useGame } from '../contexts/GameContext';
import { lintCode } from '../utils/lintingService';

export interface UseExecutionReturn {
  executionState: 'idle' | 'validating' | 'success' | 'punishment';
  punishmentType: 'bsod' | 'jail' | 'void' | null;
  execute: (code: string, language: string) => Promise<void>;
  resetExecution: () => void;
}

/**
 * Custom hook for managing code execution and punishment roulette
 * Validates code through linting service and triggers success or punishment states
 */
export const useExecution = (): UseExecutionReturn => {
  const {
    executionState,
    punishmentType,
    setExecutionState,
    setPunishmentType,
  } = useGame();

  /**
   * Execute code validation and trigger appropriate state
   * @param code - The code to validate
   * @param language - The programming language
   */
  const execute = useCallback(
    async (code: string, language: string) => {
      // Set validating state
      setExecutionState('validating');
      setPunishmentType(null);

      try {
        // Call linting service
        const errors = await lintCode(code, language);

        // Determine success vs punishment based on error count
        if (errors.length === 0) {
          // No errors - trigger success state
          setExecutionState('success');
        } else {
          // Has errors - trigger punishment roulette
          setExecutionState('punishment');

          // Random punishment selection (0-2)
          const randomPunishment = Math.floor(Math.random() * 3);
          
          switch (randomPunishment) {
            case 0:
              setPunishmentType('bsod');
              break;
            case 1:
              setPunishmentType('jail');
              break;
            case 2:
              setPunishmentType('void');
              break;
            default:
              setPunishmentType('bsod');
          }
        }
      } catch (error) {
        // If linting fails, treat as success (graceful fallback)
        console.error('Execution error:', error);
        setExecutionState('success');
      }
    },
    [setExecutionState, setPunishmentType]
  );

  /**
   * Reset execution state back to idle
   */
  const resetExecution = useCallback(() => {
    setExecutionState('idle');
    setPunishmentType(null);
  }, [setExecutionState, setPunishmentType]);

  return {
    executionState,
    punishmentType,
    execute,
    resetExecution,
  };
};
