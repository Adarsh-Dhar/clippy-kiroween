import { useState, useRef, useEffect } from 'react';
import { useFileSystem } from '../contexts/FileSystemContext';
import { useEditor } from '../contexts/EditorContext';
import { useView } from '../contexts/ViewContext';
import { codeTemplates, insertTemplate } from '../utils/codeTemplates';
import { FindReplaceDialog } from './FindReplaceDialog';
import { HelpDialog } from './HelpDialog';
import { FileDialog } from './FileDialog';

export const MenuBar = () => {
  const {
    activeFile,
    openFiles,
    createFile,
    createFolder,
    openFile,
    closeFile,
    copyNode,
    getFileContent,
    findNode,
  } = useFileSystem();
  
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    cut,
    copy,
    paste,
    selectAll,
    setFindDialogOpen,
    setReplaceDialogOpen,
    findDialogOpen,
    replaceDialogOpen,
    textareaRef,
  } = useEditor();
  
  const {
    zoomIn,
    zoomOut,
    resetZoom,
    toggleFileTree,
    toggleLineNumbers,
    toggleWordWrap,
    fileTreeVisible,
    lineNumbersVisible,
    wordWrap,
  } = useView();

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [helpTab, setHelpTab] = useState<'about' | 'shortcuts' | 'documentation'>('about');
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
  const [showGoToLineDialog, setShowGoToLineDialog] = useState(false);
  const [goToLineNumber, setGoToLineNumber] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };

    if (activeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [activeMenu]);

  const handleNewFile = () => {
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
    setActiveMenu(null);
  };

  const handleNewFolder = () => {
    const defaultName = 'New Folder';
    let newPath = `/${defaultName}`;
    let counter = 1;
    
    while (counter < 100) {
      const checkNode = findNode(newPath);
      if (!checkNode) {
        break;
      }
      newPath = `/New Folder (${counter})`;
      counter++;
    }
    
    createFolder(newPath);
    setActiveMenu(null);
  };

  const handleSave = () => {
    // Files are auto-saved, but we can add explicit save notification
    setActiveMenu(null);
  };

  const handleSaveAs = () => {
    setShowSaveAsDialog(true);
    setActiveMenu(null);
  };

  const handleSaveAsConfirm = (newName: string) => {
    if (activeFile && newName.trim()) {
      const parentPath = activeFile.split('/').slice(0, -1).join('/') || '/';
      const newPath = `${parentPath}/${newName.trim()}`;
      const content = getFileContent(activeFile);
      if (content !== null) {
        createFile(newPath, content);
        openFile(newPath);
      }
    }
    setShowSaveAsDialog(false);
  };

  const handleCloseFile = () => {
    if (activeFile) {
      closeFile(activeFile);
    }
    setActiveMenu(null);
  };

  const handleCloseAll = () => {
    openFiles.forEach(path => closeFile(path));
    setActiveMenu(null);
  };

  const handleExit = () => {
    if (window.confirm('Are you sure you want to exit?')) {
      // In a real app, this would close the window
      console.log('Exiting...');
    }
    setActiveMenu(null);
  };

  const handleGoToLine = () => {
    setShowGoToLineDialog(true);
    setActiveMenu(null);
  };

  const handleGoToLineConfirm = () => {
    const lineNum = parseInt(goToLineNumber);
    if (textareaRef?.current && !isNaN(lineNum) && lineNum > 0) {
      const text = textareaRef.current.value;
      const lines = text.split('\n');
      if (lineNum <= lines.length) {
        let position = 0;
        for (let i = 0; i < lineNum - 1; i++) {
          position += lines[i].length + 1; // +1 for newline
        }
        textareaRef.current.setSelectionRange(position, position);
        textareaRef.current.focus();
      }
    }
    setShowGoToLineDialog(false);
    setGoToLineNumber('');
  };

  const handleInsertTemplate = (templateName: string) => {
    if (!textareaRef?.current || !activeFile) return;
    
    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const currentContent = textarea.value;
    const result = insertTemplate(templateName, currentContent, cursorPos);
    
    textarea.value = result.newContent;
    textarea.setSelectionRange(result.newCursorPosition, result.newCursorPosition);
    textarea.focus();
    
    // Trigger change event
    const event = new Event('input', { bubbles: true });
    textarea.dispatchEvent(event);
    
    setActiveMenu(null);
  };

  const handleInsertDateTime = () => {
    if (!textareaRef?.current) return;
    
    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const currentContent = textarea.value;
    const dateTime = new Date().toLocaleString();
    const newContent = currentContent.substring(0, cursorPos) + dateTime + currentContent.substring(cursorPos);
    
    textarea.value = newContent;
    textarea.setSelectionRange(cursorPos + dateTime.length, cursorPos + dateTime.length);
    textarea.focus();
    
    const event = new Event('input', { bubbles: true });
    textarea.dispatchEvent(event);
    
    setActiveMenu(null);
  };

  const menuItems = [
    {
      name: 'File',
      items: [
        { label: 'New File', action: handleNewFile, shortcut: 'Ctrl+N' },
        { label: 'New Folder', action: handleNewFolder },
        { label: '---', action: null },
        { label: 'Open File...', action: () => { /* TODO: File picker */ setActiveMenu(null); } },
        { label: '---', action: null },
        { label: 'Save', action: handleSave, shortcut: 'Ctrl+S', disabled: !activeFile },
        { label: 'Save As...', action: handleSaveAs, disabled: !activeFile },
        { label: '---', action: null },
        { label: 'Close File', action: handleCloseFile, shortcut: 'Ctrl+W', disabled: !activeFile },
        { label: 'Close All', action: handleCloseAll, disabled: openFiles.length === 0 },
        { label: '---', action: null },
        { label: 'Exit', action: handleExit },
      ],
    },
    {
      name: 'Edit',
      items: [
        { label: 'Undo', action: undo, shortcut: 'Ctrl+Z', disabled: !canUndo },
        { label: 'Redo', action: redo, shortcut: 'Ctrl+Y', disabled: !canRedo },
        { label: '---', action: null },
        { label: 'Cut', action: cut, shortcut: 'Ctrl+X', disabled: !activeFile },
        { label: 'Copy', action: copy, shortcut: 'Ctrl+C', disabled: !activeFile },
        { label: 'Paste', action: paste, shortcut: 'Ctrl+V', disabled: !activeFile },
        { label: 'Select All', action: selectAll, shortcut: 'Ctrl+A', disabled: !activeFile },
        { label: '---', action: null },
        { label: 'Find...', action: () => { setFindDialogOpen(true); setActiveMenu(null); }, shortcut: 'Ctrl+F', disabled: !activeFile },
        { label: 'Replace...', action: () => { setReplaceDialogOpen(true); setActiveMenu(null); }, shortcut: 'Ctrl+H', disabled: !activeFile },
        { label: 'Go to Line...', action: handleGoToLine, shortcut: 'Ctrl+G', disabled: !activeFile },
      ],
    },
    {
      name: 'View',
      items: [
        { label: 'Zoom In', action: zoomIn, shortcut: 'Ctrl+=' },
        { label: 'Zoom Out', action: zoomOut, shortcut: 'Ctrl+-' },
        { label: 'Reset Zoom', action: resetZoom, shortcut: 'Ctrl+0' },
        { label: '---', action: null },
        { label: 'Toggle File Tree', action: toggleFileTree, checked: fileTreeVisible },
        { label: 'Toggle Line Numbers', action: toggleLineNumbers, checked: lineNumbersVisible },
        { label: 'Word Wrap', action: toggleWordWrap, checked: wordWrap },
      ],
    },
    {
      name: 'Insert',
      items: [
        { label: 'Date/Time', action: handleInsertDateTime, disabled: !activeFile },
        { label: '---', action: null },
        ...codeTemplates.map(template => ({
          label: template.name,
          action: () => handleInsertTemplate(template.name),
          disabled: !activeFile,
        })),
      ],
    },
    {
      name: 'Help',
      items: [
        { label: 'About', action: () => { setHelpTab('about'); setShowHelpDialog(true); setActiveMenu(null); } },
        { label: 'Keyboard Shortcuts', action: () => { setHelpTab('shortcuts'); setShowHelpDialog(true); setActiveMenu(null); } },
        { label: 'Documentation', action: () => { setHelpTab('documentation'); setShowHelpDialog(true); setActiveMenu(null); } },
      ],
    },
  ];

  const handleMenuClick = (menuName: string) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  return (
    <>
      <div ref={menuRef} className="win95-menu relative">
        {menuItems.map((menu) => (
          <div key={menu.name} className="relative inline-block">
            <button
              className={`win95-menu-item ${activeMenu === menu.name ? 'bg-win95-blue text-win95-white' : ''}`}
              onClick={() => handleMenuClick(menu.name)}
            >
              {menu.name}
        </button>
            {activeMenu === menu.name && menu.items.length > 0 && (
              <div
                className="absolute top-full left-0 bg-win95-gray border-2 border-solid z-50 min-w-[180px]"
        style={{
                  borderLeftColor: '#ffffff',
          borderTopColor: '#ffffff',
          borderRightColor: '#808080',
                  borderBottomColor: '#000000',
                  boxShadow: 'inset 1px 1px 0 0 #ffffff, inset -1px -1px 0 0 #808080',
                }}
              >
                {menu.items.map((item, index) => (
                  item.label === '---' ? (
                    <div key={index} className="border-t border-win95-darkgray my-1" />
                  ) : (
                    <button
                      key={index}
                      className={`block w-full text-left px-4 py-1 text-sm hover:bg-win95-blue hover:text-win95-white ${
                        item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      } ${item.checked !== undefined ? (item.checked ? 'font-bold' : '') : ''}`}
                      onClick={() => !item.disabled && item.action && item.action()}
                      disabled={item.disabled || !item.action}
                    >
                      <span>{item.label}</span>
                      {item.shortcut && (
                        <span className="float-right text-xs opacity-70 ml-4">{item.shortcut}</span>
                      )}
                      {item.checked !== undefined && item.checked && (
                        <span className="float-right text-xs">✓</span>
                      )}
                    </button>
                  )
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <FindReplaceDialog
        isOpen={findDialogOpen}
        onClose={() => setFindDialogOpen(false)}
        mode="find"
      />
      <FindReplaceDialog
        isOpen={replaceDialogOpen}
        onClose={() => setReplaceDialogOpen(false)}
        mode="replace"
      />
      <HelpDialog
        isOpen={showHelpDialog}
        onClose={() => setShowHelpDialog(false)}
        tab={helpTab}
      />
      {showSaveAsDialog && (
        <FileDialog
          isOpen={showSaveAsDialog}
          type="newFile"
          onConfirm={(value) => value && handleSaveAsConfirm(value)}
          onCancel={() => setShowSaveAsDialog(false)}
        />
      )}
      {showGoToLineDialog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowGoToLineDialog(false)}
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
            <div className="bg-win95-blue text-win95-white px-3 py-1 font-win95 text-sm font-bold">
              Go to Line
            </div>
            <div className="p-4">
              <label className="block text-sm font-win95 mb-2">Line number:</label>
              <input
                type="number"
                value={goToLineNumber}
                onChange={(e) => setGoToLineNumber(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleGoToLineConfirm();
                  } else if (e.key === 'Escape') {
                    setShowGoToLineDialog(false);
                  }
                }}
                className="w-full px-2 py-1 text-sm border-2 border-solid bg-win95-cream"
                style={{
                  borderLeftColor: '#808080',
                  borderTopColor: '#808080',
                  borderRightColor: '#dfdfdf',
                  borderBottomColor: '#dfdfdf',
                  boxShadow: 'inset 1px 1px 0 0 #808080, inset -1px -1px 0 0 #dfdfdf',
                }}
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-4">
                <button className="win95-button px-4 py-1 text-sm" onClick={handleGoToLineConfirm}>
                  Go
                </button>
                <button className="win95-button px-4 py-1 text-sm" onClick={() => setShowGoToLineDialog(false)}>
                  Cancel
      </button>
    </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
