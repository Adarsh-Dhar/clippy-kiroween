import { useEffect } from 'react';
import { useEditor } from '../contexts/EditorContext';
import { useFileSystem } from '../contexts/FileSystemContext';
import { useView } from '../contexts/ViewContext';
import { useExecution } from './useExecution';
import { useGame } from '../contexts/GameContext';

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
  
  const { 
    activeFile, 
    updateFileContent, 
    getFileContent, 
    createFile, 
    openFile, 
    closeFile,
    findNode 
  } = useFileSystem();
  const { zoomIn, zoomOut, resetZoom } = useView();
  const { execute, executionState } = useExecution();
  const { punishmentType } = useGame();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Always allow arrow keys to work normally for cursor movement
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        return;
      }

      // Only handle shortcuts when not in an input/textarea (unless it's the editor)
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      const isEditor = target.tagName === 'TEXTAREA' && target.closest('.editor-area');
      
      // Don't interfere with inputs in dialogs or modals (find/replace, etc.)
      if (isInput && !isEditor) {
        // Allow all input in dialogs and modals
        if (target.closest('.find-replace-dialog') || target.closest('[class*="modal"]')) {
          return;
        }
        return;
      }

      // Ctrl or Cmd key
      const isModifier = e.ctrlKey || e.metaKey;

      // Handle Ctrl+Enter for Run (special case - works even without modifier)
      if (isModifier && e.key === 'Enter') {
        e.preventDefault();
        // Only run if not already executing and not in punishment state
        if (activeFile && executionState !== 'validating' && executionState !== 'punishment') {
          const code = getFileContent(activeFile) || '';
          const extension = activeFile.split('.').pop()?.toLowerCase() || '';
          const languageMap: { [key: string]: string } = {
            'py': 'python',
            'js': 'javascript',
            'c': 'c',
            'cpp': 'cpp',
            'cc': 'cpp',
            'cxx': 'cpp',
            'java': 'java',
          };
          const language = languageMap[extension] || 'javascript';
          execute(code, language);
        }
        return;
      }

      if (!isModifier) return;

      // Prevent default browser behavior for our shortcuts
      switch (e.key.toLowerCase()) {
        case 'n':
          e.preventDefault();
          // Create new file
          const defaultName = 'newfile.txt';
          let newPath = `/${defaultName}`;
          let counter = 1;
          
          while (counter < 100) {
            const checkNode = findNode(newPath);
            if (!checkNode) {
              break;
            }
            newPath = `/newfile${counter}.txt`;
            counter++;
          }
          
          createFile(newPath);
          openFile(newPath);
          break;
        case 'w':
          e.preventDefault();
          // Close active file (only if one is open)
          if (activeFile) {
            closeFile(activeFile);
          }
          break;
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

    // Use capture phase to intercept shortcuts before browser handles them
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
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
    createFile,
    openFile,
    closeFile,
    findNode,
    zoomIn,
    zoomOut,
    resetZoom,
    execute,
    executionState,
    punishmentType,
  ]);
};

