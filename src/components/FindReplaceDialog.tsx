import { useEffect, useRef } from 'react';
import { useEditor } from '../contexts/EditorContext';

interface FindReplaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'find' | 'replace';
}

export const FindReplaceDialog = ({ isOpen, onClose, mode }: FindReplaceDialogProps) => {
  const {
    findText,
    replaceText,
    setFindText,
    setReplaceText,
    findNext,
    findPrevious,
    replace,
    replaceAll,
  } = useEditor();

  const findInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && findInputRef.current) {
      findInputRef.current.focus();
      findInputRef.current.select();
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      if (mode === 'replace' && e.shiftKey) {
        replaceAll();
      } else if (mode === 'replace') {
        replace();
      } else {
        findNext();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-win95-gray border-2 border-solid min-w-[400px] find-replace-dialog"
        style={{
          borderLeftColor: '#ffffff',
          borderTopColor: '#ffffff',
          borderRightColor: '#808080',
          borderBottomColor: '#000000',
          boxShadow: 'inset 1px 1px 0 0 #ffffff, inset -1px -1px 0 0 #808080',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-win95-blue text-win95-white px-3 py-1 font-win95 text-sm font-bold flex items-center justify-between">
          <span>{mode === 'find' ? 'Find' : 'Find and Replace'}</span>
          <button
            onClick={onClose}
            className="text-win95-white hover:bg-win95-darkgray px-2"
          >
            ×
          </button>
        </div>
        <div className="p-4">
          <div className="mb-3">
            <label className="block text-sm font-win95 mb-1">Find:</label>
            <input
              ref={findInputRef}
              type="text"
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-2 py-1 text-sm border-2 border-solid bg-win95-cream"
              style={{
                borderLeftColor: '#808080',
                borderTopColor: '#808080',
                borderRightColor: '#dfdfdf',
                borderBottomColor: '#dfdfdf',
                boxShadow: 'inset 1px 1px 0 0 #808080, inset -1px -1px 0 0 #dfdfdf',
              }}
              placeholder="Enter text to find"
            />
          </div>
          
          {mode === 'replace' && (
            <div className="mb-3">
              <label className="block text-sm font-win95 mb-1">Replace with:</label>
              <input
                ref={replaceInputRef}
                type="text"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-2 py-1 text-sm border-2 border-solid bg-win95-cream"
                style={{
                  borderLeftColor: '#808080',
                  borderTopColor: '#808080',
                  borderRightColor: '#dfdfdf',
                  borderBottomColor: '#dfdfdf',
                  boxShadow: 'inset 1px 1px 0 0 #808080, inset -1px -1px 0 0 #dfdfdf',
                }}
                placeholder="Enter replacement text"
              />
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              className="win95-button px-3 py-1 text-sm"
              onClick={findPrevious}
              disabled={!findText}
            >
              Find Previous
            </button>
            <button
              className="win95-button px-3 py-1 text-sm"
              onClick={findNext}
              disabled={!findText}
            >
              Find Next
            </button>
            {mode === 'replace' && (
              <>
                <button
                  className="win95-button px-3 py-1 text-sm"
                  onClick={replace}
                  disabled={!findText}
                >
                  Replace
                </button>
                <button
                  className="win95-button px-3 py-1 text-sm"
                  onClick={replaceAll}
                  disabled={!findText}
                >
                  Replace All
                </button>
              </>
            )}
            <button
              className="win95-button px-3 py-1 text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

