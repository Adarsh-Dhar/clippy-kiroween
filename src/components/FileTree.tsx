import { useState, useRef, useEffect } from 'react';
import { useFileSystem, FileNode } from '../contexts/FileSystemContext';

interface FileTreeProps {
  onFileSelect?: (path: string) => void;
}

interface ContextMenuState {
  x: number;
  y: number;
  path: string;
  type: 'file' | 'folder';
}

export const FileTree = ({ onFileSelect }: FileTreeProps) => {
  const {
    files,
    openFiles,
    activeFile,
    expandedFolders,
    toggleFolder,
    openFile,
    deleteNode,
    renameNode,
    createFile,
    createFolder,
    copyNode,
    moveNode,
    findNode,
  } = useFileSystem();

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [draggedPath, setDraggedPath] = useState<string | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [contextMenu]);

  // Focus rename input when renaming starts
  useEffect(() => {
    if (renamingPath && renameInputRef.current) {
      renameInputRef.current.focus();
      const node = files;
      const getName = (path: string) => {
        const parts = path.split('/').filter(p => p);
        return parts[parts.length - 1] || '';
      };
      setRenameValue(getName(renamingPath));
    }
  }, [renamingPath, files]);

  const handleContextMenu = (e: React.MouseEvent, path: string, type: 'file' | 'folder') => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      path,
      type,
    });
  };

  const handleRename = () => {
    if (renamingPath && renameValue.trim()) {
      renameNode(renamingPath, renameValue.trim());
      setRenamingPath(null);
      setRenameValue('');
    }
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setRenamingPath(null);
      setRenameValue('');
    }
  };

  const handleDelete = () => {
    if (contextMenu) {
      deleteNode(contextMenu.path);
      setContextMenu(null);
    }
  };

  const handleNewFile = () => {
    if (contextMenu) {
      const parentPath = contextMenu.type === 'folder' ? contextMenu.path : contextMenu.path.split('/').slice(0, -1).join('/') || '/';
      const defaultName = 'newfile.txt';
      let newPath = `${parentPath}/${defaultName}`;
      let counter = 1;
      
      // Check if file exists and generate unique name
      const checkExists = (path: string): boolean => {
        const parts = path.split('/').filter(p => p);
        let current = files;
        for (const part of parts) {
          if (current.children) {
            const found = current.children.find(c => c.name === part);
            if (found) {
              current = found;
            } else {
              return false;
            }
          } else {
            return false;
          }
        }
        return true;
      };
      
      while (checkExists(newPath)) {
        newPath = `${parentPath}/newfile${counter}.txt`;
        counter++;
      }
      
      createFile(newPath);
      setRenamingPath(newPath);
      setContextMenu(null);
      openFile(newPath);
    }
  };

  const handleNewFolder = () => {
    if (contextMenu) {
      const parentPath = contextMenu.type === 'folder' ? contextMenu.path : contextMenu.path.split('/').slice(0, -1).join('/') || '/';
      const defaultName = 'New Folder';
      let newPath = `${parentPath}/${defaultName}`;
      let counter = 1;
      
      const checkExists = (path: string): boolean => {
        const parts = path.split('/').filter(p => p);
        let current = files;
        for (const part of parts) {
          if (current.children) {
            const found = current.children.find(c => c.name === part);
            if (found) {
              current = found;
            } else {
              return false;
            }
          } else {
            return false;
          }
        }
        return true;
      };
      
      while (checkExists(newPath)) {
        newPath = `${parentPath}/New Folder (${counter})`;
        counter++;
      }
      
      createFolder(newPath);
      setRenamingPath(newPath);
      setContextMenu(null);
      toggleFolder(parentPath);
    }
  };

  const handleCopy = () => {
    if (contextMenu) {
      const parentPath = contextMenu.path.split('/').slice(0, -1).join('/') || '/';
      copyNode(contextMenu.path, parentPath);
      setContextMenu(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, path: string) => {
    setDraggedPath(path);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetPath: string) => {
    e.preventDefault();
    if (draggedPath && draggedPath !== targetPath) {
      const target = findNode(targetPath);
      if (target && target.type === 'folder' && draggedPath !== targetPath) {
        // Check if target is not a child of dragged path
        if (!draggedPath.startsWith(targetPath + '/')) {
          moveNode(draggedPath, targetPath);
        }
      }
    }
    setDraggedPath(null);
  };

  const renderNode = (node: FileNode, depth: number = 0): React.ReactNode => {
    if (node.path === '/') {
      // Render root's children
      return (
        <div>
          {node.children?.map(child => renderNode(child, depth))}
        </div>
      );
    }

    const isExpanded = expandedFolders.has(node.path);
    const isOpen = openFiles.includes(node.path);
    const isActive = activeFile === node.path;
    const isFolder = node.type === 'folder';
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center px-1 py-0.5 cursor-pointer select-none text-sm font-win95 ${
            isActive ? 'bg-win95-blue text-win95-white' : 'hover:bg-win95-lightgray'
          }`}
          style={{ paddingLeft: `${depth * 16 + 4}px` }}
          onClick={() => {
            if (isFolder) {
              toggleFolder(node.path);
            } else {
              openFile(node.path);
              if (onFileSelect) {
                onFileSelect(node.path);
              }
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, node.path, node.type)}
          draggable={node.path !== '/'}
          onDragStart={(e) => handleDragStart(e, node.path)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, node.path)}
        >
          {isFolder ? (
            <span className="mr-1 text-xs">
              {isExpanded ? '▼' : '▶'}
            </span>
          ) : (
            <span className="mr-1 text-xs w-3 inline-block">📄</span>
          )}
          {renamingPath === node.path ? (
            <input
              ref={renameInputRef}
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRename}
              onKeyDown={handleRenameKeyDown}
              className="flex-1 px-1 py-0 text-xs bg-win95-white border border-win95-darkgray focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="flex-1 truncate">{node.name}</span>
          )}
        </div>
        {isFolder && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full bg-win95-gray border-r-2 border-win95-darkgray overflow-y-auto flex flex-col">
      <div className="p-1 flex-1">
        {renderNode(files)}
      </div>
      
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-win95-gray border-2 border-solid border-win95-darkgray shadow-lg z-50"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            borderLeftColor: '#ffffff',
            borderTopColor: '#ffffff',
            borderRightColor: '#808080',
            borderBottomColor: '#000000',
          }}
        >
          <div className="py-1">
            {contextMenu.type === 'folder' && (
              <>
                <button
                  className="block w-full text-left px-4 py-1 text-sm hover:bg-win95-blue hover:text-win95-white cursor-pointer"
                  onClick={handleNewFile}
                >
                  New File
                </button>
                <button
                  className="block w-full text-left px-4 py-1 text-sm hover:bg-win95-blue hover:text-win95-white cursor-pointer"
                  onClick={handleNewFolder}
                >
                  New Folder
                </button>
                <div className="border-t border-win95-darkgray my-1" />
              </>
            )}
            <button
              className="block w-full text-left px-4 py-1 text-sm hover:bg-win95-blue hover:text-win95-white cursor-pointer"
              onClick={() => {
                setRenamingPath(contextMenu.path);
                setContextMenu(null);
              }}
            >
              Rename
            </button>
            <button
              className="block w-full text-left px-4 py-1 text-sm hover:bg-win95-blue hover:text-win95-white cursor-pointer"
              onClick={handleCopy}
            >
              Copy
            </button>
            <div className="border-t border-win95-darkgray my-1" />
            <button
              className="block w-full text-left px-4 py-1 text-sm hover:bg-win95-blue hover:text-win95-white cursor-pointer text-red-600"
              onClick={handleDelete}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

