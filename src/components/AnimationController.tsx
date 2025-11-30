interface AnimationControllerProps {
  onAnimationTrigger: (animationName: string) => void;
  onWriteClick?: () => void;
}

const buttons = [
  { label: 'Wave', animation: 'Wave' },
  { label: 'Write', animation: 'Writing', isWrite: true },
  { label: 'Confused', animation: 'GetAttention' },
  { label: 'Idle', animation: 'Idle1_1' }
];

export const AnimationController = ({ onAnimationTrigger, onWriteClick }: AnimationControllerProps) => {
  return (
    <div className="fixed bottom-4 right-4 flex gap-2 z-50">
      {buttons.map((button) => (
        <button
          key={button.label}
          onClick={() => {
            onAnimationTrigger(button.animation);
            if (button.isWrite && onWriteClick) {
              onWriteClick();
            }
          }}
          className="px-4 py-2 bg-gray-400 text-black font-win95 text-sm
                     border-2 border-t-white border-l-white border-r-gray-800 border-b-gray-800
                     hover:bg-gray-300 active:border-t-gray-800 active:border-l-gray-800 
                     active:border-r-white active:border-b-white
                     shadow-md transition-all"
          style={{
            boxShadow: '2px 2px 0px rgba(0,0,0,0.2)'
          }}
        >
          {button.label}
        </button>
      ))}
    </div>
  );
};
