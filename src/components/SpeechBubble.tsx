interface SpeechBubbleProps {
  text: string;
  anger: number;
}

export const SpeechBubble = ({ text, anger }: SpeechBubbleProps) => {
  let bgColor = 'bg-yellow-300';
  let textColor = 'text-black';

  if (anger === 1) {
    bgColor = 'bg-orange-400';
  } else if (anger === 2) {
    bgColor = 'bg-orange-500';
  } else if (anger === 3) {
    bgColor = 'bg-black';
    textColor = 'text-red-600';
  }

  return (
    <div className="relative">
      <div
        className={`${bgColor} ${textColor} px-3 py-2 rounded border-2 border-black font-win95 text-xs whitespace-nowrap shadow-lg`}
      >
        {text}
        <div className={`absolute bottom-0 left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent ${
          anger === 3 ? 'border-t-black' : bgColor === 'bg-yellow-300' ? 'border-t-yellow-300' : 'border-t-orange-400'
        }`} />
      </div>
    </div>
  );
};
