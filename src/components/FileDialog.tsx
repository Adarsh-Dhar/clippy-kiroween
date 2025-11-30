import { useEffect, useRef } from 'react';

export type DialogType = 'delete' | 'rename' | 'newFile' | 'newFolder';

interface FileDialogProps {
  isOpen: boolean;
  type: DialogType;
  fileName?: string;
  onConfirm: (value?: string) => void;
  onCancel: () => void;
}

export const FileDialog = ({ isOpen, type, fileName, onConfirm, onCancel }: FileDialogProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      if (type === 'rename' && fileName) {
        // Remove extension for renaming
        const nameWithoutExt = fileName.includes('.') 
          ? fileName.substring(0, fileName.lastIndexOf('.'))
          : fileName;
        inputRef.current.value = nameWithoutExt;
      }
    }
  }, [isOpen, type, fileName]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (type === 'delete') {
        onConfirm();
      } else if (inputRef.current) {
        onConfirm(inputRef.current.value);
      }
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (!isOpen) return null;

  const getTitle = () => {
    switch (type) {
      case 'delete':
        return 'Confirm Delete';
      case 'rename':
        return 'Rename';
      case 'newFile':
        return 'New File';
      case 'newFolder':
        return 'New Folder';
      default:
        return 'Dialog';
    }
  };

  const getMessage = () => {
    switch (type) {
      case 'delete':
        return `Are you sure you want to delete "${fileName}"?`;
      case 'rename':
        return 'Enter new name:';
      case 'newFile':
        return 'Enter file name:';
      case 'newFolder':
        return 'Enter folder name:';
      default:
        return '';
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-win95-gray border-2 border-solid min-w-[300px]"
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
          <span>{getTitle()}</span>
        </div>
        <div className="p-4">
          <p className="mb-3 text-sm font-win95">{getMessage()}</p>
          {type !== 'delete' && (
            <input
              ref={inputRef}
              type="text"
              className="w-full px-2 py-1 text-sm border-2 border-solid bg-win95-cream"
              style={{
                borderLeftColor: '#808080',
                borderTopColor: '#808080',
                borderRightColor: '#dfdfdf',
                borderBottomColor: '#dfdfdf',
                boxShadow: 'inset 1px 1px 0 0 #808080, inset -1px -1px 0 0 #dfdfdf',
              }}
              onKeyDown={handleKeyDown}
              placeholder={type === 'newFile' ? 'filename.txt' : type === 'newFolder' ? 'Folder Name' : ''}
            />
          )}
          <div className="flex justify-end gap-2 mt-4">
            <button
              className="win95-button px-4 py-1 text-sm"
              onClick={() => {
                if (type === 'delete') {
                  onConfirm();
                } else if (inputRef.current) {
                  onConfirm(inputRef.current.value);
                }
              }}
            >
              {type === 'delete' ? 'Yes' : 'OK'}
            </button>
            <button className="win95-button px-4 py-1 text-sm" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

