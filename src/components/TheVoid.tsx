import { useState, useEffect, useRef } from 'react';

interface TheVoidProps {
  isOpen: boolean;
  onEscape: () => void;
}

export const TheVoid = ({ isOpen, onEscape }: TheVoidProps) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [buttonPos, setButtonPos] = useState({ top: 0, left: 0 });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Generate random button position on mount
  useEffect(() => {
    if (isOpen) {
      const randomTop = Math.random() * 80 + 10; // 10-90%
      const randomLeft = Math.random() * 80 + 10; // 10-90%
      setButtonPos({ top: randomTop, left: randomLeft });

      // Play drone sound
      try {
        const audio = new Audio('/sounds/drone.mp3');
        audio.volume = 0.3;
        audio.loop = true;
        audio.play().catch(err => {
          console.warn('Drone sound not available:', err);
        });
        audioRef.current = audio;
      } catch (error) {
        console.warn('Error playing drone sound:', error);
      }
    }

    return () => {
      // Stop audio on unmount or close
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [isOpen]);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleEscape = () => {
    // Fade out audio
    if (audioRef.current) {
      const fadeOut = setInterval(() => {
        if (audioRef.current && audioRef.current.volume > 0.1) {
          audioRef.current.volume -= 0.1;
        } else {
          clearInterval(fadeOut);
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
          }
        }
      }, 50);
      
      // Store interval reference for cleanup if component unmounts during fade
      // Note: This is a local variable, but the interval will clear itself when done
      // If component unmounts, the useEffect cleanup will handle audioRef.current
    }

    onEscape();
  };

  if (!isOpen) return null;

  // Calculate eye positions to follow mouse
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  
  // Left eye
  const leftEyeX = centerX - 50;
  const leftEyeY = centerY;
  const leftAngle = Math.atan2(mousePos.y - leftEyeY, mousePos.x - leftEyeX);
  const leftPupilX = Math.cos(leftAngle) * 8;
  const leftPupilY = Math.sin(leftAngle) * 8;

  // Right eye
  const rightEyeX = centerX + 50;
  const rightEyeY = centerY;
  const rightAngle = Math.atan2(mousePos.y - rightEyeY, mousePos.x - rightEyeX);
  const rightPupilX = Math.cos(rightAngle) * 8;
  const rightPupilY = Math.sin(rightAngle) * 8;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
      onMouseMove={handleMouseMove}
      role="dialog"
      aria-modal="true"
      aria-label="The Void - Find the hidden escape button"
    >
      <style>
        {`
          .eye {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: radial-gradient(circle at center, rgba(255, 0, 0, 0.9) 0%, rgba(255, 0, 0, 0.6) 40%, rgba(139, 0, 0, 0.8) 100%);
            box-shadow: 0 0 20px rgba(255, 0, 0, 0.8), 0 0 40px rgba(255, 0, 0, 0.5);
            position: relative;
            transition: all 0.1s ease;
          }
          
          .pupil {
            width: 15px;
            height: 15px;
            border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.9) 100%);
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            transition: all 0.1s ease;
          }
        `}
      </style>

      {/* Eyes */}
      <div className="flex gap-24">
        {/* Left eye */}
        <div className="eye">
          <div
            className="pupil"
            style={{
              transform: `translate(calc(-50% + ${leftPupilX}px), calc(-50% + ${leftPupilY}px))`,
            }}
          />
        </div>

        {/* Right eye */}
        <div className="eye">
          <div
            className="pupil"
            style={{
              transform: `translate(calc(-50% + ${rightPupilX}px), calc(-50% + ${rightPupilY}px))`,
            }}
          />
        </div>
      </div>

      {/* Invisible escape button */}
      <button
        onClick={handleEscape}
        className="absolute w-[10px] h-[10px] cursor-pointer"
        style={{
          top: `${buttonPos.top}%`,
          left: `${buttonPos.left}%`,
          opacity: 0.05,
          background: 'transparent',
          border: 'none',
        }}
        aria-label="Escape button"
      />
    </div>
  );
};
