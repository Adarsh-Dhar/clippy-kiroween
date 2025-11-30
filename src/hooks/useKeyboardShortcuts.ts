import { useEffect } from 'react';
import { useEditor } from '../contexts/EditorContext';
import { useFileSystem } from '../contexts/FileSystemContext';
import { useView } from '../contexts/ViewContext';

export const useKeyboardShortcuts = () => {
  const {
    cut,
    copy,
    paste,
    undo,
    redo,
    selectAll,
    setFindDialogOpen,
    setReplaceDialogOpen,
  } = useEditor();
  
  const { activeFile, updateFileContent, getFileContent } = useFileSystem();
  const { zoomIn, zoomOut, resetZoom } = useView();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not in an input/textarea (unless it's the editor)
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      const isEditor = target.tagName === 'TEXTAREA' && target.closest('.editor-area');
      
      // Allow shortcuts in editor, but not in dialogs
      if (isInput && !isEditor && !target.closest('.find-replace-dialog')) {
        return;
      }

      // Ctrl or Cmd key
      const isModifier = e.ctrlKey || e.metaKey;

      if (!isModifier) return;

      // Prevent default browser behavior for our shortcuts
      switch (e.key.toLowerCase()) {
        case 's':
          e.preventDefault();
          // Save is handled automatically, but we can add explicit save here
          if (activeFile) {
            const content = getFileContent(activeFile);
            if (content !== null) {
              updateFileContent(activeFile, content);
            }
          }
          break;
        case 'z':
          if (!e.shiftKey) {
            e.preventDefault();
            undo();
          }
          break;
        case 'y':
          e.preventDefault();
          redo();
          break;
        case 'x':
          e.preventDefault();
          cut();
          break;
        case 'c':
          e.preventDefault();
          copy();
          break;
        case 'v':
          e.preventDefault();
          paste();
          break;
        case 'a':
          e.preventDefault();
          selectAll();
          break;
        case 'f':
          e.preventDefault();
          setFindDialogOpen(true);
          break;
        case 'h':
          e.preventDefault();
          setReplaceDialogOpen(true);
          break;
        case '=':
        case '+':
          e.preventDefault();
          zoomIn();
          break;
        case '-':
        case '_':
          e.preventDefault();
          zoomOut();
          break;
        case '0':
          e.preventDefault();
          resetZoom();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    cut,
    copy,
    paste,
    undo,
    redo,
    selectAll,
    setFindDialogOpen,
    setReplaceDialogOpen,
    activeFile,
    getFileContent,
    updateFileContent,
    zoomIn,
    zoomOut,
    resetZoom,
  ]);
};

