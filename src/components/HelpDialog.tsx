import { useState } from 'react';

type HelpTab = 'about' | 'shortcuts' | 'documentation';

interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tab?: HelpTab;
}

export const HelpDialog = ({ isOpen, onClose, tab: initialTab = 'about' }: HelpDialogProps) => {
  const [activeTab, setActiveTab] = useState<HelpTab>(initialTab);

  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl+S', desc: 'Save file' },
    { key: 'Ctrl+Z', desc: 'Undo' },
    { key: 'Ctrl+Y', desc: 'Redo' },
    { key: 'Ctrl+X', desc: 'Cut' },
    { key: 'Ctrl+C', desc: 'Copy' },
    { key: 'Ctrl+V', desc: 'Paste' },
    { key: 'Ctrl+A', desc: 'Select All' },
    { key: 'Ctrl+F', desc: 'Find' },
    { key: 'Ctrl+H', desc: 'Replace' },
    { key: 'Ctrl+G', desc: 'Go to Line' },
    { key: 'Ctrl+=', desc: 'Zoom In' },
    { key: 'Ctrl+-', desc: 'Zoom Out' },
  ];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-win95-gray border-2 border-solid min-w-[500px] max-w-[600px] max-h-[80vh] flex flex-col"
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
          <span>Help</span>
          <button
            onClick={onClose}
            className="text-win95-white hover:bg-win95-darkgray px-2"
          >
            ×
          </button>
        </div>
        
        <div className="flex border-b-2 border-win95-darkgray">
          <button
            className={`px-4 py-2 text-sm font-win95 ${
              activeTab === 'about'
                ? 'bg-win95-gray border-b-2 border-b-win95-gray -mb-0.5'
                : 'hover:bg-win95-lightgray'
            }`}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
          <button
            className={`px-4 py-2 text-sm font-win95 ${
              activeTab === 'shortcuts'
                ? 'bg-win95-gray border-b-2 border-b-win95-gray -mb-0.5'
                : 'hover:bg-win95-lightgray'
            }`}
            onClick={() => setActiveTab('shortcuts')}
          >
            Shortcuts
          </button>
          <button
            className={`px-4 py-2 text-sm font-win95 ${
              activeTab === 'documentation'
                ? 'bg-win95-gray border-b-2 border-b-win95-gray -mb-0.5'
                : 'hover:bg-win95-lightgray'
            }`}
            onClick={() => setActiveTab('documentation')}
          >
            Documentation
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {activeTab === 'about' && (
            <div>
              <h2 className="text-lg font-bold mb-2">Microsoft Word 97 - Developer Edition</h2>
              <p className="text-sm mb-2">Version 1.0.0</p>
              <p className="text-sm mb-4">
                A Windows 95-styled IDE with Clippy assistant. Write code, get real-time linting feedback, 
                and enjoy the nostalgic experience of classic Windows development.
              </p>
              <p className="text-sm">
                Features:
              </p>
              <ul className="text-sm list-disc list-inside ml-4 mt-2">
                <li>Multi-file editing with file tree</li>
                <li>Real-time code linting</li>
                <li>Interactive Clippy assistant</li>
                <li>Windows 95 authentic UI</li>
                <li>Support for multiple programming languages</li>
              </ul>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div>
              <h2 className="text-lg font-bold mb-4">Keyboard Shortcuts</h2>
              <div className="space-y-2">
                {shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex justify-between items-center py-1 border-b border-win95-lightgray">
                    <span className="text-sm font-code bg-win95-lightgray px-2 py-0.5">{shortcut.key}</span>
                    <span className="text-sm">{shortcut.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'documentation' && (
            <div>
              <h2 className="text-lg font-bold mb-4">Documentation</h2>
              <div className="space-y-4 text-sm">
                <div>
                  <h3 className="font-bold mb-2">Getting Started</h3>
                  <p className="mb-2">
                    Welcome to the Developer Edition IDE! This application provides a complete development 
                    environment with file management, code editing, and real-time linting.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold mb-2">File Management</h3>
                  <p className="mb-2">
                    Use the file tree on the left to navigate your project. Right-click on files or folders 
                    to access context menu options. You can create, rename, delete, and move files and folders.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold mb-2">Code Editing</h3>
                  <p className="mb-2">
                    The editor supports multiple files with tabs. Code is automatically linted as you type. 
                    Use the language selector to specify the programming language for better linting results.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold mb-2">Clippy Assistant</h3>
                  <p className="mb-2">
                    Clippy will help you with code errors and provide feedback. The assistant's mood changes 
                    based on the number of errors in your code. Keep your code clean to keep Clippy happy!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t-2 border-win95-darkgray flex justify-end">
          <button className="win95-button px-4 py-1 text-sm" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

