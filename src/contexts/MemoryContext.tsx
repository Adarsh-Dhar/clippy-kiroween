/**
 * MemoryContext - React context wrapper for Clippy's memory system
 * 
 * Provides easy access to memory service and reactive updates.
 * "I never forget. Ever."
 */

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { memoryService, MemoryService } from '../services/memoryService';

interface MemoryContextType {
  /** The memory service instance */
  service: MemoryService;
  
  /** Summary statistics about memory */
  summary: {
    totalMistakes: number;
    commonMistakes: number;
    totalPatterns: number;
    totalInteractions: number;
    totalDeaths: number;
  };
  
  /** Force refresh the summary */
  refresh: () => void;
}

const MemoryContext = createContext<MemoryContextType | undefined>(undefined);

/**
 * Hook to access memory context
 */
export const useMemory = (): MemoryContextType => {
  const context = useContext(MemoryContext);
  if (!context) {
    throw new Error('useMemory must be used within a MemoryProvider');
  }
  return context;
};

interface MemoryProviderProps {
  children: ReactNode;
}

/**
 * Provider component for memory context
 */
export const MemoryProvider = ({ children }: MemoryProviderProps) => {
  const [summary, setSummary] = useState({
    totalMistakes: 0,
    commonMistakes: 0,
    totalPatterns: 0,
    totalInteractions: 0,
    totalDeaths: 0,
  });

  // Load initial summary
  useEffect(() => {
    memoryService.getSummary().then(setSummary);
  }, []);

  // Refresh summary periodically
  useEffect(() => {
    const interval = setInterval(() => {
      memoryService.getSummary().then(setSummary);
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const refresh = useCallback(() => {
    memoryService.getSummary().then(setSummary);
  }, []);

  const value: MemoryContextType = {
    service: memoryService,
    summary,
    refresh
  };

  return (
    <MemoryContext.Provider value={value}>
      {children}
    </MemoryContext.Provider>
  );
};
