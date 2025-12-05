import { useState, useRef, useEffect } from 'react';
import { MainWindow } from './components/MainWindow';
import { GameProvider, useGame } from './contexts/GameContext';
import { FileSystemProvider, useFileSystem } from './contexts/FileSystemContext';
import { EditorProvider } from './contexts/EditorContext';
import { ViewProvider } from './contexts/ViewContext';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { FakeTerminal } from './components/FakeTerminal';
import { ClippyJail } from './components/ClippyJail';
import { TheVoid } from './components/TheVoid';
import { BSOD } from './components/BSOD';
import { gameStateService } from './services/gameStateService';

function EditorWrapper() {
  const { activeFile, getFileContent, updateFileContent } = useFileSystem();
  
  const getCurrentContent = () => {
    if (!activeFile) return '';
    return getFileContent(activeFile) || '';
  };

  const handleContentChange = (content: string) => {
    if (activeFile) {
      updateFileContent(activeFile, content);
    }
  };

  return (
    <EditorProvider
      onContentChange={handleContentChange}
      getCurrentContent={getCurrentContent}
    >
      <EditorContent />
    </EditorProvider>
  );
}

function EditorContent() {
  useKeyboardShortcuts();
  const { 
    setAngerLevel, 
    setErrorCount, 
    executionState, 
    punishmentType,
    setExecutionState,
    setPunishmentType 
  } = useGame();
  const containerRef = useRef<HTMLDivElement>(null);
  const [angerLevel, setLocalAngerLevel] = useState(0);
  
  // Watch for MCP-triggered punishments
  useEffect(() => {
    const checkPunishments = async () => {
      try {
        const punishment = await gameStateService.getPunishment();
        if (punishment) {
          // Map punishment type to our PunishmentType
          const typeMap: Record<string, 'bsod' | 'jail' | 'void' | null> = {
            bsod: 'bsod',
            jail: 'jail',
            void: 'void',
            glitch: 'jail', // Map glitch to jail for now
          };
          
          const mappedType = typeMap[punishment.type] || null;
          if (mappedType) {
            setPunishmentType(mappedType);
            setExecutionState('punishment');
          }
        }
      } catch (error) {
        console.error('Error checking for punishments:', error);
      }
    };
    
    // Check every second for MCP-triggered punishments
    const interval = setInterval(checkPunishments, 1000);
    
    return () => clearInterval(interval);
  }, [setPunishmentType, setExecutionState]);

  const handleAngerChange = (level: number) => {
    setLocalAngerLevel(level);
    setAngerLevel(level);
  };

  const handleErrorCountChange = (count: number) => {
    setErrorCount(count);
  };

  // Trigger Clippy congratulate animation when execution succeeds
  useEffect(() => {
    if (executionState === 'success') {
      // Try to access the Clippy agent instance
      const agent = window.clippyAgent;
      if (agent && typeof agent.play === 'function') {
        try {
          agent.play('Congratulate');
          // Play Tada sound effect
          try {
            const audio = new Audio('/sounds/tada.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => {
              // Silently fail if sound file doesn't exist
            });
          } catch {
            // Silently fail if audio creation fails
          }
        } catch (error) {
          console.warn('Failed to play Clippy congratulate animation:', error);
        }
      }
    }
  }, [executionState]);

  const handleSuccessComplete = () => {
    // Success animation is automatically handled by useClippyBrain hook
    // when errorCount transitions from >0 to 0
    // Reset to idle after success animation completes
    setExecutionState('idle');
  };

  const handleEscape = () => {
    // Reset execution state when escaping from punishment
    setExecutionState('idle');
    setPunishmentType(null);
  };


  let bgColor = 'bg-win95-teal';
  let bgHex = '#008080';

  if (angerLevel >= 2) {
    bgColor = 'bg-win95-darkred';
    bgHex = '#400000';
  }

  return (
    <>
      <div
        ref={containerRef}
        className={`min-h-screen w-full ${bgColor} flex items-center justify-center p-4 transition-colors duration-500 font-win95`}
        style={{ backgroundColor: bgHex }}
      >
        <MainWindow
          anger={angerLevel}
          clippyMessage=""
          onAngerChange={handleAngerChange}
          onErrorCountChange={handleErrorCountChange}
        />
      </div>

      {/* Execution overlays - order matters for z-index */}
      {executionState === 'punishment' && punishmentType === 'jail' && (
        <ClippyJail isOpen={true} onEscape={handleEscape} />
      )}
      
      {executionState === 'success' && (
        <FakeTerminal isOpen={true} onComplete={handleSuccessComplete} />
      )}
      
      {executionState === 'punishment' && punishmentType === 'bsod' && (
        <BSOD />
      )}
      
      {executionState === 'punishment' && punishmentType === 'void' && (
        <TheVoid isOpen={true} onEscape={handleEscape} />
      )}
    </>
  );
}

function App() {
  return (
    <GameProvider>
      <FileSystemProvider>
        <ViewProvider>
          <EditorWrapper />
        </ViewProvider>
      </FileSystemProvider>
    </GameProvider>
  );
}

export default App;
