import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface GameContextType {
  gameState: 'PLAYING' | 'CRASHED';
  angerLevel: number;
  errorCount: number;
  setAngerLevel: (level: number) => void;
  setErrorCount: (count: number) => void;
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

  // Automatically trigger crash when anger level reaches 5
  useEffect(() => {
    if (angerLevel >= 5 && gameState !== 'CRASHED') {
      setGameState('CRASHED');
    }
  }, [angerLevel, gameState]);

  const triggerCrash = () => {
    setGameState('CRASHED');
  };

  const resetGame = () => {
    setAngerLevel(0);
    setErrorCount(0);
    setGameState('PLAYING');
  };

  const value: GameContextType = {
    gameState,
    angerLevel,
    errorCount,
    setAngerLevel,
    setErrorCount,
    triggerCrash,
    resetGame,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
