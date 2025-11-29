import { useState } from 'react';

interface EditorAreaProps {
  anger: number;
  value: string;
  onChange: (value: string) => void;
}

export const EditorArea = ({ anger, value, onChange }: EditorAreaProps) => {
  const lines = value.split('\n');
  const maxLines = Math.max(lines.length, 10);

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
