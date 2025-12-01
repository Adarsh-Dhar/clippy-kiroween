import { useState, useEffect } from 'react';

interface FakeTerminalProps {
  isOpen: boolean;
  onComplete: () => void;
}

const TERMINAL_MESSAGES = [
  '> Compiling source...',
  '> Linking libraries...',
  '> Optimizing assets...',
  '> Process exited with code 0.',
];

export const FakeTerminal = ({ isOpen, onComplete }: FakeTerminalProps) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedMessages, setDisplayedMessages] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when closed
      setCurrentMessageIndex(0);
      setDisplayedMessages([]);
      return;
    }

    // Display messages sequentially with random delays
    if (currentMessageIndex < TERMINAL_MESSAGES.length) {
      const randomDelay = Math.random() * 400 + 100; // 100-500ms
      
      const timer = setTimeout(() => {
        setDisplayedMessages(prev => [...prev, TERMINAL_MESSAGES[currentMessageIndex]]);
        setCurrentMessageIndex(prev => prev + 1);
      }, randomDelay);

      return () => clearTimeout(timer);
    } else if (currentMessageIndex === TERMINAL_MESSAGES.length) {
      // All messages displayed, call onComplete
      const completeTimer = setTimeout(() => {
        onComplete();
      }, 500);

      return () => clearTimeout(completeTimer);
    }
  }, [isOpen, currentMessageIndex, onComplete]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 h-[200px] bg-black text-[#00FF00] font-mono p-4 overflow-y-auto animate-slide-up z-50"
      style={{
        fontFamily: "'Courier New', monospace",
        animation: 'slideUp 300ms ease-out',
      }}
      role="status"
      aria-live="polite"
      aria-label="Code execution terminal output"
    >
      <style>
        {`
          @keyframes slideUp {
            from {
              transform: translateY(100%);
            }
            to {
              transform: translateY(0);
            }
          }
        `}
      </style>
      {displayedMessages.map((message, index) => (
        <div key={index} className="mb-1">
          {message}
        </div>
      ))}
    </div>
  );
};
