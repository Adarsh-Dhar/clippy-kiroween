import { useState, useRef } from 'react';
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
import { ApologyModal } from './components/ApologyModal';

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

  const handleAngerChange = (level: number) => {
    setLocalAngerLevel(level);
    setAngerLevel(level);
  };

  const handleErrorCountChange = (count: number) => {
    setErrorCount(count);
  };

  const handleSuccessComplete = () => {
    // Trigger Clippy congratulate animation
    try {
      const clippyAgent = (window as any).clippy;
      if (clippyAgent) {
        clippyAgent.play('Congratulate');
      }
    } catch (error) {
      console.warn('Could not trigger Clippy animation:', error);
    }
    
    // Reset to idle after success animation completes
    setExecutionState('idle');
  };

  const handleEscape = () => {
    // Reset execution state when escaping from punishment
    setExecutionState('idle');
    setPunishmentType(null);
  };

  const handleApologyAccepted = () => {
    // Reset execution state when apology is accepted
    setExecutionState('idle');
    setPunishmentType(null);
  };

  const handleApologyTimeout = () => {
    // Handle timeout - could trigger crash or just reset
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
      
      {executionState === 'punishment' && punishmentType === 'apology' && (
        <ApologyModal 
          isOpen={true} 
          onApologyAccepted={handleApologyAccepted}
          onTimeout={handleApologyTimeout}
        />
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
