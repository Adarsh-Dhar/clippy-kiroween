import { Minus, Square, X } from 'lucide-react';

interface TitleBarProps {
  title: string;
  onClose?: () => void;
  closeDisabled?: boolean;
}

export const TitleBar = ({ title, onClose, closeDisabled = false }: TitleBarProps) => {
  return (
    <div className="win95-titlebar">
      <span>{title}</span>
      <div className="flex gap-0">
        <button className="win95-button p-1 w-6 h-6 flex items-center justify-center">
          <Minus size={14} />
        </button>
        <button className="win95-button p-1 w-6 h-6 flex items-center justify-center">
          <Square size={14} />
        </button>
        <button
          onClick={onClose}
          disabled={closeDisabled}
          className={`win95-button p-1 w-6 h-6 flex items-center justify-center ${
            closeDisabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
