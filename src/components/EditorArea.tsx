import { useState, useEffect, useRef } from 'react';
import { ValidationError } from '../utils/codeValidator';
import { lintCode } from '../utils/lintingService';
import { detectLanguage } from '../utils/languageDetector';
import { useFileSystem } from '../contexts/FileSystemContext';
import { useEditor } from '../contexts/EditorContext';
import { useView } from '../contexts/ViewContext';

interface EditorAreaProps {
  anger: number;
  onAngerChange?: (angerLevel: number) => void;
  onErrorCountChange?: (errorCount: number) => void;
  onErrorsChange?: (errors: ValidationError[]) => void;
  onLintingChange?: (isLinting: boolean) => void;
  selectedLanguage?: string | null;
}

export const EditorArea = ({ anger, onAngerChange, onErrorCountChange, onErrorsChange, onLintingChange, selectedLanguage }: EditorAreaProps) => {
  const { activeFile, getFileContent, updateFileContent } = useFileSystem();
  const { setTextareaRef, saveState } = useEditor();
  const { zoom, lineNumbersVisible, wordWrap } = useView();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isLinting, setIsLinting] = useState(false);
  const [localContent, setLocalContent] = useState('');
  const perFileErrorsRef = useRef<Map<string, ValidationError[]>>(new Map());
  const perFileContentRef = useRef<Map<string, string>>(new Map());

  // Expose textarea ref to EditorContext
  useEffect(() => {
    if (textareaRef.current) {
      setTextareaRef(textareaRef);
    }
  }, [setTextareaRef]);

  // Load content when active file changes
  useEffect(() => {
    if (activeFile) {
      const content = getFileContent(activeFile) || '';
      setLocalContent(content);
      perFileContentRef.current.set(activeFile, content);
      
      // Restore errors for this file if they exist
      const fileErrors = perFileErrorsRef.current.get(activeFile) || [];
      setErrors(fileErrors);
      if (onErrorsChange) {
        onErrorsChange(fileErrors);
      }
    } else {
      setLocalContent('');
      setErrors([]);
      if (onErrorsChange) {
        onErrorsChange([]);
      }
    }
  }, [activeFile, getFileContent, onErrorsChange]);

  // Save content to file system when it changes
  const handleContentChange = (newContent: string) => {
    const oldContent = localContent;
    setLocalContent(newContent);
    if (activeFile) {
      updateFileContent(activeFile, newContent);
      perFileContentRef.current.set(activeFile, newContent);
    }
    // Save state for undo/redo (only if content actually changed)
    if (oldContent !== newContent) {
      saveState(oldContent);
    }
  };

  const lines = localContent.split('\n');
  const maxLines = Math.max(lines.length, 10);

  // Debounced validation logic using backend API - per file
  useEffect(() => {
    if (!activeFile) {
      setErrors([]);
      if (onErrorsChange) {
        onErrorsChange([]);
      }
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLinting(true);
      if (onLintingChange) {
        onLintingChange(true);
      }

      try {
        // Use selected language if provided, otherwise auto-detect
        const language = selectedLanguage || detectLanguage(localContent);
        
        // Call backend API to lint the code
        const validationErrors = await lintCode(localContent, language);
        
        // Ensure we have a valid array
        const errorsArray = Array.isArray(validationErrors) ? validationErrors : [];
        
        // Store errors per file
        perFileErrorsRef.current.set(activeFile, errorsArray);
        setErrors(errorsArray);
        
        // Expose errors to parent component
        if (onErrorsChange) {
          onErrorsChange(errorsArray);
        }
      } catch (error) {
        console.error('Error during linting:', error);
        // Clear errors on any error
        const emptyErrors: ValidationError[] = [];
        perFileErrorsRef.current.set(activeFile, emptyErrors);
        setErrors(emptyErrors);
        if (onErrorsChange) {
          onErrorsChange(emptyErrors);
        }
      } finally {
        setIsLinting(false);
        if (onLintingChange) {
          onLintingChange(false);
        }
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [localContent, activeFile, selectedLanguage, onErrorsChange, onLintingChange]);

  // Calculate anger level based on error count (0-4 scale)
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
      } else {
        // Cap at level 4 - let Clippy handle all error states
        angerLevel = 4;
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

  const fontSize = `${zoom / 100}rem`;
  const lineHeight = `${(zoom / 100) * 1.5}rem`;

  return (
    <div className={`flex border-2 border-solid h-full editor-area ${textClass}`}
      style={{
        borderLeftColor: anger >= 2 ? '#444' : '#808080',
        borderTopColor: anger >= 2 ? '#444' : '#808080',
        borderRightColor: anger >= 2 ? '#999' : '#dfdfdf',
        borderBottomColor: anger >= 2 ? '#999' : '#dfdfdf',
        boxShadow: anger >= 2 ? 'inset 1px 1px 0 0 #444, inset -1px -1px 0 0 #999' : 'inset 1px 1px 0 0 #808080, inset -1px -1px 0 0 #dfdfdf'
      }}>
      {lineNumbersVisible && (
        <div className={`px-2 py-2 font-code select-none border-r-2 overflow-y-auto ${anger >= 2 ? 'bg-gray-700 border-gray-600 text-gray-500' : 'bg-gray-200 border-gray-300 text-gray-600'}`}
          style={{ fontSize, lineHeight }}>
          {Array.from({ length: maxLines }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
      )}
      <textarea
        ref={textareaRef}
        value={localContent}
        onChange={(e) => handleContentChange(e.target.value)}
        className={`flex-1 px-2 py-2 font-code resize-none focus:outline-none overflow-y-auto ${bgClass} ${textClass} ${anger === 2 ? 'animate-glitch' : ''}`}
        style={{
          caretColor: anger === 3 ? '#ff0000' : 'auto',
          fontSize,
          lineHeight,
        }}
        wrap={wordWrap ? 'soft' : 'off'}
        disabled={!activeFile}
        placeholder={!activeFile ? 'No file open' : ''}
      />
    </div>
  );
};
