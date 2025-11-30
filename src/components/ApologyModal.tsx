import { useState, useEffect, useRef } from 'react';

interface ApologyModalProps {
  isOpen: boolean;
  onApologyAccepted: () => void;
  onTimeout: () => void;
}

const REQUIRED_PHRASE = 'i am sorry clippy';

export const ApologyModal = ({ isOpen, onApologyAccepted, onTimeout }: ApologyModalProps) => {
  const [mode, setMode] = useState<'voice' | 'typing'>('voice');
  const [isListening, setIsListening] = useState(false);
  const [apologyCount, setApologyCount] = useState(0);
  const [typedText, setTypedText] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTypedApologySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const normalized = typedText.toLowerCase().trim();
    if (normalized === REQUIRED_PHRASE) {
      console.log('Valid apology typed');
      const newCount = apologyCount + 1;
      setApologyCount(newCount);
      setTypedText('');
      
      // Check if we've reached 10 apologies
      if (newCount >= 10) {
        console.log('10 apologies completed!');
        onApologyAccepted();
      }
    } else {
      console.log('Invalid apology, expected:', REQUIRED_PHRASE);
    }
  };

  // Detect Speech Recognition API and initialize
  useEffect(() => {
    if (!isOpen) return;

    const SpeechRecognitionAPI = 
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      console.log('Speech Recognition API not available, switching to typing mode');
      setMode('typing');
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI() as SpeechRecognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognitionRef.current = recognition;
      setMode('voice');
      
      // Start 5-second silence timer
      const startSilenceTimer = () => {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        silenceTimerRef.current = setTimeout(() => {
          console.log('Silence timeout - triggering crash');
          recognition.stop();
          onTimeout();
        }, 5000);
      };

      // Handle speech recognition results
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const results = event.results;
        let finalTranscript = '';
        
        // Reset silence timer on any speech
        startSilenceTimer();
        
        for (let i = event.resultIndex; i < results.length; i++) {
          const result = results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          }
        }
        
        if (finalTranscript) {
          const normalized = finalTranscript.toLowerCase().trim();
          console.log('Transcript:', normalized);
          
          // Check for apology keywords
          if (normalized.includes('sorry') || normalized.includes('apologize')) {
            console.log('Apology detected!');
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
            }
            recognition.stop();
            onApologyAccepted();
          }
        }
      };
      
      // Handle errors
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          console.log('Microphone permission denied, switching to typing mode');
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }
          setMode('typing');
          setIsListening(false);
        } else if (event.error === 'no-speech') {
          // No speech detected, timer will handle timeout
          console.log('No speech detected');
        } else {
          // Other errors - attempt restart if within timeout
          console.log('Attempting to restart recognition');
          try {
            recognition.start();
          } catch (restartError) {
            console.error('Failed to restart recognition:', restartError);
            setMode('typing');
          }
        }
      };

      // Handle recognition end
      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
      };
      
      // Start listening
      recognition.start();
      setIsListening(true);
      startSilenceTimer();
      console.log('Speech recognition started');
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
      setMode('typing');
    }

    // Cleanup function
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current.abort();
        } catch (error) {
          console.warn('Error stopping recognition on cleanup:', error);
        }
      }
    };
  }, [isOpen, onApologyAccepted, onTimeout]);

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center animate-fade-in"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        animation: 'fadeIn 300ms ease-in'
      }}
    >
      <div className="text-white text-center font-win95">
        {mode === 'voice' && (
          <div className="space-y-8">
            <div className="flex justify-center">
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="animate-pulse-scale"
                style={{
                  filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5))',
                  animation: 'pulseScale 1s ease-in-out infinite'
                }}
              >
                <path
                  d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z"
                  fill="#FF0000"
                />
                <path
                  d="M17 11C17 14.31 14.31 17 11 17C7.69 17 5 14.31 5 11H3C3 15.42 6.58 19 11 19V22H13V19C17.42 19 21 15.42 21 11H19C19 14.31 16.31 17 13 17C9.69 17 7 14.31 7 11H17Z"
                  fill="#FF0000"
                />
              </svg>
            </div>
            <p className="text-2xl font-bold tracking-wider">
              SAY IT. SAY YOU ARE SORRY.
            </p>
            {isListening && (
              <p className="text-sm text-gray-400">Listening...</p>
            )}
          </div>
        )}
        {mode === 'typing' && (
          <div className="space-y-6">
            <p className="text-xl font-bold">SPEECH NOT AVAILABLE</p>
            <p className="text-lg">Type "I am sorry Clippy" 10 times</p>
            <form onSubmit={handleTypedApologySubmit}>
              <input
                type="text"
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                className="w-[400px] h-[40px] border-2 border-white bg-black text-white text-base px-2"
                placeholder="Type here..."
                autoFocus
              />
            </form>
            <p className="text-lg text-yellow-400">Progress: {apologyCount}/10</p>
          </div>
        )}
      </div>
    </div>
  );
};
