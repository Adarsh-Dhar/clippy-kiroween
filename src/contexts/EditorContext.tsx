import { createContext, useContext, useState, useRef, ReactNode, useCallback } from 'react';

interface EditorContextType {
  textareaRef: React.RefObject<HTMLTextAreaElement> | null;
  setTextareaRef: (ref: React.RefObject<HTMLTextAreaElement>) => void;
  undoHistory: string[];
  redoHistory: string[];
  canUndo: boolean;
  canRedo: boolean;
  clipboard: string;
  cut: () => void;
  copy: () => void;
  paste: () => void;
  undo: () => void;
  redo: () => void;
  selectAll: () => void;
  saveState: (content: string) => void;
  findDialogOpen: boolean;
  replaceDialogOpen: boolean;
  setFindDialogOpen: (open: boolean) => void;
  setReplaceDialogOpen: (open: boolean) => void;
  findText: string;
  replaceText: string;
  setFindText: (text: string) => void;
  setReplaceText: (text: string) => void;
  findNext: () => void;
  findPrevious: () => void;
  replace: () => void;
  replaceAll: () => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
};

interface EditorProviderProps {
  children: ReactNode;
  onContentChange?: (content: string) => void;
  getCurrentContent?: () => string;
  onStateSave?: (content: string) => void;
}

export const EditorProvider = ({ children, onContentChange, getCurrentContent, onStateSave }: EditorProviderProps) => {
  const [textareaRef, setTextareaRefState] = useState<React.RefObject<HTMLTextAreaElement> | null>(null);
  const [undoHistory, setUndoHistory] = useState<string[]>([]);
  const [redoHistory, setRedoHistory] = useState<string[]>([]);
  const [clipboard, setClipboard] = useState<string>('');
  const [findDialogOpen, setFindDialogOpen] = useState(false);
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  const setTextareaRef = useCallback((ref: React.RefObject<HTMLTextAreaElement>) => {
    setTextareaRefState(ref);
  }, []);

  const saveState = useCallback((content: string) => {
    setUndoHistory(prev => {
      const newHistory = [...prev, content];
      // Keep only last 50 states
      return newHistory.slice(-50);
    });
    setRedoHistory([]); // Clear redo history when new action is performed
    if (onStateSave) {
      onStateSave(content);
    }
  }, [onStateSave]);

  const getSelection = useCallback((): { start: number; end: number; text: string } | null => {
    if (!textareaRef?.current) return null;
    const textarea = textareaRef.current;
    return {
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
      text: textarea.value.substring(textarea.selectionStart, textarea.selectionEnd),
    };
  }, [textareaRef]);

  const setSelection = useCallback((start: number, end: number) => {
    if (!textareaRef?.current) return;
    const textarea = textareaRef.current;
    textarea.setSelectionRange(start, end);
    textarea.focus();
  }, [textareaRef]);

  const cut = useCallback(() => {
    const selection = getSelection();
    if (!selection || !textareaRef?.current || !getCurrentContent) return;
    
    const text = getCurrentContent();
    const selectedText = selection.text;
    
    if (selectedText) {
      setClipboard(selectedText);
      const newContent = text.substring(0, selection.start) + text.substring(selection.end);
      if (textareaRef.current) {
        textareaRef.current.value = newContent;
        const event = new Event('input', { bubbles: true });
        textareaRef.current.dispatchEvent(event);
      }
      if (onContentChange) {
        onContentChange(newContent);
      }
      saveState(text);
      setSelection(selection.start, selection.start);
    }
  }, [getSelection, textareaRef, getCurrentContent, onContentChange, saveState, setSelection]);

  const copy = useCallback(() => {
    const selection = getSelection();
    if (!selection) return;
    
    const selectedText = selection.text;
    if (selectedText) {
      setClipboard(selectedText);
      // Also copy to system clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(selectedText).catch(() => {
          // Fallback if clipboard API fails
        });
      }
    }
  }, [getSelection]);

  const paste = useCallback(async () => {
    if (!textareaRef?.current || !getCurrentContent) return;
    
    let textToPaste = clipboard;
    
    // Try to get from system clipboard first
    if (navigator.clipboard && navigator.clipboard.readText) {
      try {
        textToPaste = await navigator.clipboard.readText();
        setClipboard(textToPaste);
      } catch {
        // Fallback to internal clipboard
      }
    }
    
    if (textToPaste) {
      const text = getCurrentContent();
      const selection = getSelection();
      const start = selection?.start ?? textareaRef.current.selectionStart;
      const end = selection?.end ?? textareaRef.current.selectionEnd;
      
      const newContent = text.substring(0, start) + textToPaste + text.substring(end);
      if (textareaRef.current) {
        textareaRef.current.value = newContent;
        const event = new Event('input', { bubbles: true });
        textareaRef.current.dispatchEvent(event);
      }
      if (onContentChange) {
        onContentChange(newContent);
      }
      saveState(text);
      setSelection(start + textToPaste.length, start + textToPaste.length);
    }
  }, [clipboard, textareaRef, getCurrentContent, getSelection, onContentChange, saveState, setSelection]);

  const undo = useCallback(() => {
    if (undoHistory.length === 0 || !getCurrentContent || !onContentChange) return;
    
    const currentContent = getCurrentContent();
    setRedoHistory(prev => [currentContent, ...prev]);
    const previousState = undoHistory[undoHistory.length - 1];
    setUndoHistory(prev => prev.slice(0, -1));
    if (textareaRef?.current) {
      textareaRef.current.value = previousState;
      const event = new Event('input', { bubbles: true });
      textareaRef.current.dispatchEvent(event);
    }
    onContentChange(previousState);
  }, [undoHistory, getCurrentContent, onContentChange, textareaRef]);

  const redo = useCallback(() => {
    if (redoHistory.length === 0 || !onContentChange) return;
    
    const nextState = redoHistory[0];
    setRedoHistory(prev => prev.slice(1));
    setUndoHistory(prev => [...prev, getCurrentContent?.() || '']);
    if (textareaRef?.current) {
      textareaRef.current.value = nextState;
      const event = new Event('input', { bubbles: true });
      textareaRef.current.dispatchEvent(event);
    }
    onContentChange(nextState);
  }, [redoHistory, getCurrentContent, onContentChange, textareaRef]);

  const selectAll = useCallback(() => {
    if (!textareaRef?.current) return;
    const textarea = textareaRef.current;
    textarea.setSelectionRange(0, textarea.value.length);
    textarea.focus();
  }, [textareaRef]);

  const findNext = useCallback(() => {
    if (!findText || !textareaRef?.current || !getCurrentContent) return;
    
    const content = getCurrentContent();
    const startPos = textareaRef.current.selectionEnd;
    const index = content.toLowerCase().indexOf(findText.toLowerCase(), startPos);
    
    if (index !== -1) {
      setSelection(index, index + findText.length);
    } else if (startPos > 0) {
      // Wrap around to beginning
      const wrapIndex = content.toLowerCase().indexOf(findText.toLowerCase(), 0);
      if (wrapIndex !== -1) {
        setSelection(wrapIndex, wrapIndex + findText.length);
      }
    }
  }, [findText, textareaRef, getCurrentContent, setSelection]);

  const findPrevious = useCallback(() => {
    if (!findText || !textareaRef?.current || !getCurrentContent) return;
    
    const content = getCurrentContent();
    const startPos = textareaRef.current.selectionStart;
    
    // Search backwards
    const beforeText = content.substring(0, startPos);
    const index = beforeText.toLowerCase().lastIndexOf(findText.toLowerCase());
    
    if (index !== -1) {
      setSelection(index, index + findText.length);
    } else {
      // Wrap around to end
      const afterText = content.substring(startPos);
      const wrapIndex = afterText.toLowerCase().lastIndexOf(findText.toLowerCase());
      if (wrapIndex !== -1) {
        const actualIndex = startPos + wrapIndex;
        setSelection(actualIndex, actualIndex + findText.length);
      }
    }
  }, [findText, textareaRef, getCurrentContent, setSelection]);

  const replace = useCallback(() => {
    if (!findText || !textareaRef?.current || !getCurrentContent || !onContentChange) return;
    
    const content = getCurrentContent();
    const selection = getSelection();
    
    if (selection && selection.text.toLowerCase() === findText.toLowerCase()) {
      const newContent = content.substring(0, selection.start) + replaceText + content.substring(selection.end);
      onContentChange(newContent);
      saveState(content);
      setSelection(selection.start, selection.start + replaceText.length);
      findNext();
    }
  }, [findText, replaceText, textareaRef, getCurrentContent, onContentChange, getSelection, saveState, setSelection, findNext]);

  const replaceAll = useCallback(() => {
    if (!findText || !getCurrentContent || !onContentChange) return;
    
    const content = getCurrentContent();
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const newContent = content.replace(regex, replaceText);
    
    if (newContent !== content) {
      onContentChange(newContent);
      saveState(content);
    }
  }, [findText, replaceText, getCurrentContent, onContentChange, saveState]);

  const value: EditorContextType = {
    textareaRef,
    setTextareaRef,
    undoHistory,
    redoHistory,
    canUndo: undoHistory.length > 0,
    canRedo: redoHistory.length > 0,
    clipboard,
    cut,
    copy,
    paste,
    undo,
    redo,
    selectAll,
    saveState,
    findDialogOpen,
    replaceDialogOpen,
    setFindDialogOpen,
    setReplaceDialogOpen,
    findText,
    replaceText,
    setFindText,
    setReplaceText,
    findNext,
    findPrevious,
    replace,
    replaceAll,
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
};

