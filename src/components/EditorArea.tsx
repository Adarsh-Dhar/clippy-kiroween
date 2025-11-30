import { useState, useEffect } from 'react';
import { validateCode, ValidationError } from '../utils/codeValidator';

interface EditorAreaProps {
  anger: number;
  value: string;
  onChange: (value: string) => void;
  onAngerChange?: (angerLevel: number) => void;
  onErrorCountChange?: (errorCount: number) => void;
}

export const EditorArea = ({ anger, value, onChange, onAngerChange, onErrorCountChange }: EditorAreaProps) => {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const lines = value.split('\n');
  const maxLines = Math.max(lines.length, 10);

  // Debounced validation logic
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const validationErrors = validateCode(value);
      setErrors(validationErrors);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [value]);

  // Calculate anger level based on error count (0-5 scale)
  useEffect(() => {
    const errorCount = errors.length;
    
    // Update error count if callback provided
    if (onErrorCountChange) {
      onErrorCountChange(errorCount);
    }

    // Calculate anger level
    if (onAngerChange) {
      let angerLevel = 0;

      if (errorCount === 0) {
        angerLevel = 0;
      } else if (errorCount >= 1 && errorCount <= 2) {
        angerLevel = 1;
      } else if (errorCount >= 3 && errorCount <= 4) {
        angerLevel = 2;
      } else if (errorCount >= 5 && errorCount <= 7) {
        angerLevel = 3;
      } else if (errorCount >= 8 && errorCount <= 10) {
        angerLevel = 4;
      } else {
        angerLevel = 5;
      }

      onAngerChange(angerLevel);
    }
  }, [errors, onAngerChange, onErrorCountChange]);

  let bgClass = 'bg-win95-cream';
  let textClass = 'text-black';

  if (anger >= 2) {
    bgClass = 'bg-gray-800';
    textClass = anger === 3 ? 'text-red-500' : 'text-gray-300';
  }

  return (
    <div className={`flex border-2 border-solid ${textClass}`}
      style={{
        borderLeftColor: anger >= 2 ? '#444' : '#808080',
        borderTopColor: anger >= 2 ? '#444' : '#808080',
        borderRightColor: anger >= 2 ? '#999' : '#dfdfdf',
        borderBottomColor: anger >= 2 ? '#999' : '#dfdfdf',
        boxShadow: anger >= 2 ? 'inset 1px 1px 0 0 #444, inset -1px -1px 0 0 #999' : 'inset 1px 1px 0 0 #808080, inset -1px -1px 0 0 #dfdfdf'
      }}>
      <div className={`px-2 py-2 font-code text-xs leading-6 select-none border-r-2 ${anger >= 2 ? 'bg-gray-700 border-gray-600 text-gray-500' : 'bg-gray-200 border-gray-300 text-gray-600'}`}>
        {Array.from({ length: maxLines }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`flex-1 px-2 py-2 font-code text-xs leading-6 resize-none focus:outline-none ${bgClass} ${textClass} ${anger === 2 ? 'animate-glitch' : ''}`}
        style={{ caretColor: anger === 3 ? '#ff0000' : 'auto' }}
        rows={10}
        wrap="off"
      />
    </div>
  );
};
