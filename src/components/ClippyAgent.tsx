import { SpeechBubble } from './SpeechBubble';

interface ClippyAgentProps {
  anger: number;
  message: string;
}

const CLIPPY_MESSAGES = {
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

export const ClippyAgent = ({ anger, message }: ClippyAgentProps) => {
  const displayMessage = message || CLIPPY_MESSAGES[anger as keyof typeof CLIPPY_MESSAGES][0];

  return (
    <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2">
      <SpeechBubble text={displayMessage} anger={anger} />
      <div className="text-5xl select-none drop-shadow-lg">
        📎
      </div>
    </div>
  );
};
