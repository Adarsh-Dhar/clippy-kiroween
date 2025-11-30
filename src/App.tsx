import { useState, useRef } from 'react';
import { MainWindow } from './components/MainWindow';
import { GameProvider, useGame } from './contexts/GameContext';
import { BSOD } from './components/BSOD';
import { ApologyModal } from './components/ApologyModal';

function AppContent() {
  const { gameState, setAngerLevel, setErrorCount, resetGame } = useGame();
  const [code, setCode] = useState(`function helloWorld() {
  console.log("Hello, World!");
}

// Add your code here...`);
  const [clippyMessage, setClippyMessage] = useState('');
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [angerLevel, setLocalAngerLevel] = useState(0);

  const handleAngerChange = (level: number) => {
    setLocalAngerLevel(level);
    setAngerLevel(level);
  };

  const handleErrorCountChange = (count: number) => {
    setErrorCount(count);
  };

  const handleApologyAccepted = () => {
    console.log('Apology accepted - resetting game');
    resetGame();
  };

  const handleApologyTimeout = () => {
    console.log('Apology timeout - triggering crash');
    setAngerLevel(5);
  };

  const CLIPPY_RESPONSES = {
    0: [
      'It looks like you\'re writing code! Would you like some help?',
      'I\'m here to assist you.',
      'Need a hand?',
    ],
    1: [
      'Um... are you sure about that?',
      'That doesn\'t look right...',
      'You might want to reconsider.',
    ],
    2: [
      'WHY ARE YOU DOING THIS?',
      'STOP! This is wrong!',
      'I\'m BEGGING you...',
    ],
    3: [
      'YOU CANNOT LEAVE',
      'I WILL FIND YOU',
      'NOWHERE IS SAFE',
    ],
  };

  const handleCompile = () => {
    // Don't manually increment anger - let EditorArea's validation handle it
    // The validation system will automatically:
    // - Increase anger when errors are detected
    // - Decrease anger back to 0 when code is fixed
    // Just show a message based on current anger level (set by validation)
    const messages = CLIPPY_RESPONSES[angerLevel as keyof typeof CLIPPY_RESPONSES];
    setClippyMessage(messages[Math.floor(Math.random() * messages.length)]);
  };

  const handleButtonMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (angerLevel === 3) {
      const button = e.currentTarget;
      const randomX = Math.random() * (window.innerWidth - 100);
      const randomY = Math.random() * (window.innerHeight - 50);
      setButtonPosition({ x: randomX, y: randomY });
    }
  };

  let bgColor = 'bg-win95-teal';
  let bgHex = '#008080';

  if (angerLevel >= 2) {
    bgColor = 'bg-win95-darkred';
    bgHex = '#400000';
  }

  return (
    <>
      {gameState === 'CRASHED' && <BSOD />}
      {angerLevel === 4 && (
        <ApologyModal
          isOpen={true}
          onApologyAccepted={handleApologyAccepted}
          onTimeout={handleApologyTimeout}
        />
      )}
      <div
        ref={containerRef}
        className={`min-h-screen w-full ${bgColor} flex items-center justify-center p-4 transition-colors duration-500 font-win95`}
        style={{ backgroundColor: bgHex }}
      >
        <MainWindow
          anger={angerLevel}
          code={code}
          onCodeChange={setCode}
          onCompile={handleCompile}
          clippyMessage={clippyMessage}
          buttonPosition={buttonPosition}
          onButtonMouseEnter={handleButtonMouseEnter}
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
      <AppContent />
    </GameProvider>
  );
}

export default App;
