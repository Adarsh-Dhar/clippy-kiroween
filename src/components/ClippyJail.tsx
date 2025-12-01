import { useState, useEffect } from 'react';

interface ClippyJailProps {
  isOpen: boolean;
  onEscape: () => void;
}

const CLICKS_TO_ESCAPE = 20;

export const ClippyJail = ({ isOpen, onEscape }: ClippyJailProps) => {
  const [clickCount, setClickCount] = useState(0);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setClickCount(0);
    }
  }, [isOpen]);

  const handleClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    // Play clang sound
    try {
      const audio = new Audio('/sounds/clang.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => {
        console.warn('Clang sound not available:', err);
      });
    } catch (error) {
      console.warn('Error playing clang sound:', error);
    }

    // Trigger shake animation
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 200);

    // Check if escaped
    if (newCount >= CLICKS_TO_ESCAPE) {
      setTimeout(() => {
        onEscape();
      }, 300);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClick={handleClick}
      role="dialog"
      aria-modal="true"
      aria-label="Clippy Jail - Click bars to escape"
    >
      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          
          .bar-shake {
            animation: shake 0.2s ease-in-out;
          }
        `}
      </style>

      {/* Iron bars */}
      <div
        className={`absolute inset-0 flex justify-around ${isShaking ? 'bar-shake' : ''}`}
        style={{ pointerEvents: 'none' }}
      >
        {Array.from({ length: 15 }).map((_, index) => (
          <div
            key={index}
            className="w-5 h-full bg-gradient-to-r from-gray-600 via-gray-500 to-gray-600"
            style={{
              boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.5), inset 2px 0 4px rgba(255,255,255,0.3)',
            }}
          />
        ))}
      </div>

      {/* Click counter display */}
      <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-lg border-2 border-gray-600 font-mono text-lg z-10">
        {clickCount} / {CLICKS_TO_ESCAPE} clicks
      </div>

      {/* Message */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-red-900 text-white px-8 py-4 rounded-lg border-2 border-red-700 font-win95 text-xl text-center z-10 max-w-md">
        <div className="font-bold mb-2">🚨 CLIPPY JAIL 🚨</div>
        <div className="text-sm">Click the bars to break free!</div>
      </div>
    </div>
  );
};
