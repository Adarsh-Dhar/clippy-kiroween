import { useState, useRef } from 'react';
import { MainWindow } from './components/MainWindow';
import { GameProvider, useGame } from './contexts/GameContext';
import { FileSystemProvider, useFileSystem } from './contexts/FileSystemContext';
import { EditorProvider } from './contexts/EditorContext';
import { ViewProvider } from './contexts/ViewContext';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

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
  const { setAngerLevel, setErrorCount } = useGame();
  const containerRef = useRef<HTMLDivElement>(null);
  const [angerLevel, setLocalAngerLevel] = useState(0);

  const handleAngerChange = (level: number) => {
    setLocalAngerLevel(level);
    setAngerLevel(level);
  };

  const handleErrorCountChange = (count: number) => {
    setErrorCount(count);
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
