import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { memoryService } from '../services/memoryService';

export type ExecutionState = 'idle' | 'validating' | 'success' | 'punishment';
export type PunishmentType = 'bsod' | 'apology' | 'jail' | 'void' | null;

export interface GameContextType {
  gameState: 'PLAYING' | 'CRASHED';
  angerLevel: number;
  errorCount: number;
  executionState: ExecutionState;
  punishmentType: PunishmentType;
  setAngerLevel: (level: number) => void;
  setErrorCount: (count: number) => void;
  setExecutionState: (state: ExecutionState) => void;
  setPunishmentType: (type: PunishmentType) => void;
  triggerCrash: () => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider = ({ children }: GameProviderProps) => {
  const [gameState, setGameState] = useState<'PLAYING' | 'CRASHED'>('PLAYING');
  const [angerLevel, setAngerLevel] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [executionState, setExecutionState] = useState<ExecutionState>('idle');
  const [punishmentType, setPunishmentType] = useState<PunishmentType>(null);
  
  // Track previous anger level for memory system
  const prevAngerLevelRef = useRef(0);

  // Cap anger level at 4 - let Clippy handle all error states
  useEffect(() => {
    if (angerLevel > 4) {
      setAngerLevel(4);
    }
  }, [angerLevel]);

  // Record anger level changes in memory system
  useEffect(() => {
    if (angerLevel !== prevAngerLevelRef.current) {
      // Determine trigger
      let trigger = 'user-action';
      if (angerLevel > prevAngerLevelRef.current) {
        trigger = errorCount > 0 ? 'syntax-error' : 'user-action';
      } else if (angerLevel < prevAngerLevelRef.current) {
        trigger = 'error-fixed';
      }

      // Record in memory
      memoryService.recordAngerChange(angerLevel, trigger);
      
      // Check for BSOD
      if (angerLevel >= 5) {
        memoryService.recordAngerChange(5, 'bsod-triggered');
      }

      prevAngerLevelRef.current = angerLevel;
    }
  }, [angerLevel, errorCount]);

  const triggerCrash = () => {
    setGameState('CRASHED');
  };

  const resetGame = () => {
    setAngerLevel(0);
    setErrorCount(0);
    setGameState('PLAYING');
    setExecutionState('idle');
    setPunishmentType(null);
  };

  const value: GameContextType = {
    gameState,
    angerLevel,
    errorCount,
    executionState,
    punishmentType,
    setAngerLevel,
    setErrorCount,
    setExecutionState,
    setPunishmentType,
    triggerCrash,
    resetGame,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
