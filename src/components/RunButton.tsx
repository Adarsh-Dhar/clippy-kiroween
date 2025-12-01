import { Play } from 'lucide-react';

interface RunButtonProps {
  onClick: () => void;
  disabled: boolean;
}

export const RunButton = ({ onClick, disabled }: RunButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`win95-button px-3 py-1 text-sm flex items-center gap-2 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
      title="Run Code (Ctrl+Enter)"
      aria-label="Run code and validate"
      style={{
        marginLeft: '8px',
      }}
    >
      <Play size={16} className="text-green-600" fill="currentColor" aria-hidden="true" />
      <span>Run</span>
    </button>
  );
};
