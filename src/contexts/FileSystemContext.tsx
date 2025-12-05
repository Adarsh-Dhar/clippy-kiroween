import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  created?: Date;
  modified?: Date;
  accessed?: Date;
}

export interface FileProperties {
  name: string;
  type: string;
  location: string;
  size: number;
  sizeFormatted: string;
  created: Date;
  modified: Date;
  accessed: Date;
}

interface FileSystemContextType {
  files: FileNode;
  openFiles: string[];
  activeFile: string | null;
  expandedFolders: Set<string>;
  diskSpaceUsed: number;
  diskSpaceLimit: number;
  fileAssociations: Map<string, string>;
  showSaveAsDialog: boolean;
  showOpenDialog: boolean;
  showFileAssociationDialog: boolean;
  showPropertiesDialog: boolean;
  showDiskWarning: boolean;
  showErrorDialog: boolean;
  errorDialogMessage: string;
  errorDialogCode: string;
  selectedFileForProperties: string | null;
  pendingFileForAssociation: string | null;
  createFile: (path: string, content?: string) => void;
  createFolder: (path: string) => void;
  deleteNode: (path: string) => void;
  renameNode: (oldPath: string, newName: string) => void;
  moveNode: (sourcePath: string, targetPath: string) => void;
  copyNode: (sourcePath: string, targetPath: string) => void;
  updateFileContent: (path: string, content: string) => void;
  getFileContent: (path: string) => string | null;
  openFile: (path: string) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string | null) => void;
  toggleFolder: (path: string) => void;
  findNode: (path: string) => FileNode | null;
  getNodeByPath: (path: string) => FileNode | null;
  calculateDiskSpace: () => number;
  checkDiskSpace: (fileSize: number) => boolean;
  setFileAssociation: (extension: string, handler: string) => void;
  getFileAssociation: (extension: string) => string | null;
  triggerSaveAsDialog: () => void;
  triggerOpenDialog: () => void;
  triggerFileError: (message: string, code: string) => void;
  getFileProperties: (path: string) => FileProperties | null;
  setShowSaveAsDialog: (show: boolean) => void;
  setShowOpenDialog: (show: boolean) => void;
  setShowFileAssociationDialog: (show: boolean) => void;
  setShowPropertiesDialog: (show: boolean) => void;
  setShowDiskWarning: (show: boolean) => void;
  setShowErrorDialog: (show: boolean) => void;
  setSelectedFileForProperties: (path: string | null) => void;
}

const FileSystemContext = createContext<FileSystemContextType | undefined>(undefined);

export const useFileSystem = () => {
  const context = useContext(FileSystemContext);
  if (!context) {
    throw new Error('useFileSystem must be used within a FileSystemProvider');
  }
  return context;
};

interface FileSystemProviderProps {
  children: ReactNode;
}

// Helper function to generate unique ID
const generateId = () => `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper function to split path into parts
const splitPath = (path: string): string[] => {
  return path.split('/').filter(p => p !== '');
};

// Helper function to get parent path
const getParentPath = (path: string): string => {
  const parts = splitPath(path);
  parts.pop();
  return parts.length > 0 ? '/' + parts.join('/') : '/';
};

// Helper function to get node name from path
const getNameFromPath = (path: string): string => {
  const parts = splitPath(path);
  return parts[parts.length - 1] || 'root';
};

// Helper function to find node in tree
const findNodeInTree = (node: FileNode, path: string): FileNode | null => {
  if (node.path === path) {
    return node;
  }
  
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeInTree(child, path);
      if (found) return found;
    }
  }
  
  return null;
};

// Helper function to find parent node
const findParentNode = (root: FileNode, path: string): FileNode | null => {
  const parentPath = getParentPath(path);
  if (parentPath === '/') {
    return root;
  }
  return findNodeInTree(root, parentPath);
};

// Helper function to remove node from parent
const removeFromParent = (parent: FileNode, nodePath: string): void => {
  if (parent.children) {
    parent.children = parent.children.filter(child => child.path !== nodePath);
  }
};

// Helper function to add node to parent
const addToParent = (parent: FileNode, node: FileNode): void => {
  if (!parent.children) {
    parent.children = [];
  }
  parent.children.push(node);
};

// Helper function to update all paths in subtree
const updatePathsInSubtree = (node: FileNode, newBasePath: string): void => {
  node.path = newBasePath;
  if (node.children) {
    for (const child of node.children) {
      updatePathsInSubtree(child, `${newBasePath}/${child.name}`);
    }
  }
};

// Helper function to deep clone a node
const cloneNode = (node: FileNode): FileNode => {
  const cloned: FileNode = {
    id: generateId(),
    name: node.name,
    path: node.path, // Will be updated after copy
    type: node.type,
    content: node.content,
  };
  
  if (node.children) {
    cloned.children = node.children.map(child => cloneNode(child));
  }
  
  return cloned;
};

export const FileSystemProvider = ({ children }: FileSystemProviderProps) => {
  const now = new Date();
  
  // Initialize with default project structure
  const [files, setFiles] = useState<FileNode>(() => ({
    id: 'root',
    name: 'root',
    path: '/',
    type: 'folder',
    created: now,
    modified: now,
    accessed: now,
    children: [
      {
        id: generateId(),
        name: 'src',
        path: '/src',
        type: 'folder',
        created: now,
        modified: now,
        accessed: now,
        children: [
          {
            id: generateId(),
            name: 'main.js',
            path: '/src/main.js',
            type: 'file',
            created: now,
            modified: now,
            accessed: now,
            content: `function helloWorld() {
  console.log("Hello, World!");
}

// Add your code here...`,
          },
        ],
      },
      {
        id: generateId(),
        name: 'README.md',
        path: '/README.md',
        type: 'file',
        created: now,
        modified: now,
        accessed: now,
        content: '# Project\n\nWelcome to your project!',
      },
    ],
  }));

  const [openFiles, setOpenFiles] = useState<string[]>(['/src/main.js']);
  const [activeFile, setActiveFile] = useState<string | null>('/src/main.js');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/', '/src']));
  
  // New state for disk space and dialogs
  const [diskSpaceLimit] = useState<number>(10 * 1024 * 1024); // 10MB
  const [fileAssociations, setFileAssociations] = useState<Map<string, string>>(() => {
    // Load from localStorage
    const stored = localStorage.getItem('fileAssociations');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return new Map(Object.entries(parsed));
      } catch (e) {
        console.error('Failed to load file associations', e);
      }
    }
    // Default associations
    return new Map([
      ['.txt', 'text-editor'],
      ['.js', 'code-editor'],
      ['.py', 'code-editor'],
      ['.c', 'code-editor'],
      ['.cpp', 'code-editor'],
      ['.java', 'code-editor'],
      ['.md', 'text-editor'],
    ]);
  });
  
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [showFileAssociationDialog, setShowFileAssociationDialog] = useState(false);
  const [showPropertiesDialog, setShowPropertiesDialog] = useState(false);
  const [showDiskWarning, setShowDiskWarning] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorDialogMessage, setErrorDialogMessage] = useState('');
  const [errorDialogCode, setErrorDialogCode] = useState('');
  const [selectedFileForProperties, setSelectedFileForProperties] = useState<string | null>(null);
  const [pendingFileForAssociation, setPendingFileForAssociation] = useState<string | null>(null);

  // Calculate disk space recursively
  const calculateDiskSpaceRecursive = useCallback((node: FileNode): number => {
    if (node.type === 'file') {
      return (node.content || '').length;
    }
    if (node.children) {
      return node.children.reduce((total, child) => total + calculateDiskSpaceRecursive(child), 0);
    }
    return 0;
  }, []);

  const diskSpaceUsed = useMemo(() => {
    return calculateDiskSpaceRecursive(files);
  }, [files, calculateDiskSpaceRecursive]);

  const calculateDiskSpace = useCallback((): number => {
    return diskSpaceUsed;
  }, [diskSpaceUsed]);

  const checkDiskSpace = useCallback((fileSize: number): boolean => {
    return (diskSpaceUsed + fileSize) <= diskSpaceLimit;
  }, [diskSpaceUsed, diskSpaceLimit]);

  const setFileAssociation = useCallback((extension: string, handler: string) => {
    setFileAssociations(prev => {
      const newMap = new Map(prev);
      newMap.set(extension, handler);
      // Save to localStorage
      const obj = Object.fromEntries(newMap);
      localStorage.setItem('fileAssociations', JSON.stringify(obj));
      return newMap;
    });
  }, []);

  const getFileAssociation = useCallback((extension: string): string | null => {
    return fileAssociations.get(extension) || null;
  }, [fileAssociations]);

  const triggerSaveAsDialog = useCallback(() => {
    setShowSaveAsDialog(true);
  }, []);

  const triggerOpenDialog = useCallback(() => {
    setShowOpenDialog(true);
  }, []);

  const triggerFileError = useCallback((message: string, code: string) => {
    setErrorDialogMessage(message);
    setErrorDialogCode(code);
    setShowErrorDialog(true);
    
    // Emit event for Clippy and GameContext
    window.dispatchEvent(new CustomEvent('file-error', {
      detail: { message, code, timestamp: Date.now() }
    }));
  }, []);

  const getFileProperties = useCallback((path: string): FileProperties | null => {
    const node = findNodeInTree(files, path);
    if (!node) return null;

    const getFileType = (name: string, type: string): string => {
      if (type === 'folder') return 'File Folder';
      const ext = name.split('.').pop()?.toLowerCase();
      const typeMap: { [key: string]: string } = {
        'txt': 'Text Document',
        'js': 'JavaScript File',
        'py': 'Python File',
        'c': 'C Source File',
        'cpp': 'C++ Source File',
        'java': 'Java Source File',
        'md': 'Markdown Document',
      };
      return typeMap[ext || ''] || 'File';
    };

    const formatFileSize = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} bytes`;
      const kb = (bytes / 1024).toFixed(2);
      return `${bytes.toLocaleString()} bytes (${kb} KB)`;
    };

    const size = node.type === 'file' ? (node.content || '').length : 0;
    const parentPath = getParentPath(path);

    return {
      name: node.name,
      type: getFileType(node.name, node.type),
      location: parentPath === '/' ? '/' : parentPath,
      size,
      sizeFormatted: formatFileSize(size),
      created: node.created || new Date(),
      modified: node.modified || new Date(),
      accessed: node.accessed || new Date(),
    };
  }, [files]);

  const findNode = useCallback((path: string): FileNode | null => {
    return findNodeInTree(files, path);
  }, [files]);

  const getNodeByPath = useCallback((path: string): FileNode | null => {
    return findNode(path);
  }, [findNode]);

  const createFile = useCallback((path: string, content: string = '') => {
    // Check disk space before creating
    const fileSize = content.length;
    if (!checkDiskSpace(fileSize)) {
      triggerFileError(
        'Cannot create file. There is not enough space on the disk.',
        '0x80070070'
      );
      return;
    }

    // Check if approaching disk limit (80%)
    const usageAfterCreate = diskSpaceUsed + fileSize;
    if (usageAfterCreate > diskSpaceLimit * 0.8 && diskSpaceUsed <= diskSpaceLimit * 0.8) {
      setShowDiskWarning(true);
      window.dispatchEvent(new CustomEvent('disk-warning', {
        detail: { used: usageAfterCreate, limit: diskSpaceLimit }
      }));
    }

    setFiles(prevFiles => {
      const newFiles = { ...prevFiles };
      const parent = findParentNode(newFiles, path);
      
      if (!parent || parent.type !== 'folder') {
        console.error('Cannot create file: parent folder not found');
        triggerFileError(
          'Cannot create file. The system cannot find the path specified.',
          '0x80070003'
        );
        return prevFiles;
      }
      
      // Check if file already exists
      if (findNodeInTree(newFiles, path)) {
        console.error('File already exists');
        triggerFileError(
          'Cannot create file. A file with that name already exists.',
          '0x80070050'
        );
        return prevFiles;
      }
      
      const now = new Date();
      const newNode: FileNode = {
        id: generateId(),
        name: getNameFromPath(path),
        path,
        type: 'file',
        content,
        created: now,
        modified: now,
        accessed: now,
      };
      
      addToParent(parent, newNode);
      
      // Update parent modified time
      parent.modified = now;
      
      return newFiles;
    });
  }, [checkDiskSpace, diskSpaceUsed, diskSpaceLimit, triggerFileError]);

  const createFolder = useCallback((path: string) => {
    setFiles(prevFiles => {
      const newFiles = { ...prevFiles };
      const parent = findParentNode(newFiles, path);
      
      if (!parent || parent.type !== 'folder') {
        console.error('Cannot create folder: parent folder not found');
        return prevFiles;
      }
      
      // Check if folder already exists
      if (findNodeInTree(newFiles, path)) {
        console.error('Folder already exists');
        return prevFiles;
      }
      
      const now = new Date();
      const newNode: FileNode = {
        id: generateId(),
        name: getNameFromPath(path),
        path,
        type: 'folder',
        children: [],
        created: now,
        modified: now,
        accessed: now,
      };
      
      addToParent(parent, newNode);
      parent.modified = now;
      
      return newFiles;
    });
  }, []);

  const deleteNode = useCallback((path: string) => {
    if (path === '/') {
      console.error('Cannot delete root');
      return;
    }
    
    setFiles(prevFiles => {
      const newFiles = { ...prevFiles };
      const parent = findParentNode(newFiles, path);
      
      if (!parent) {
        console.error('Cannot delete: parent not found');
        return prevFiles;
      }
      
      removeFromParent(parent, path);
      return newFiles;
    });
    
    // Close file if it's open
    setOpenFiles(prev => prev.filter(p => p !== path));
    if (activeFile === path) {
      const remaining = openFiles.filter(p => p !== path);
      setActiveFile(remaining.length > 0 ? remaining[remaining.length - 1] : null);
    }
  }, [activeFile, openFiles]);

  const renameNode = useCallback((oldPath: string, newName: string) => {
    if (oldPath === '/') {
      console.error('Cannot rename root');
      return;
    }
    
    setFiles(prevFiles => {
      const newFiles = { ...prevFiles };
      const node = findNodeInTree(newFiles, oldPath);
      
      if (!node) {
        console.error('Node not found');
        return prevFiles;
      }
      
      const parentPath = getParentPath(oldPath);
      const newPath = parentPath === '/' ? `/${newName}` : `${parentPath}/${newName}`;
      
      // Check if new name conflicts with existing node
      if (findNodeInTree(newFiles, newPath)) {
        console.error('A node with this name already exists');
        return prevFiles;
      }
      
      node.name = newName;
      updatePathsInSubtree(node, newPath);
      
      return newFiles;
    });
    
    // Update open files and active file if renamed
    setOpenFiles(prev => prev.map(p => {
      if (p === oldPath) {
        const parentPath = getParentPath(oldPath);
        return parentPath === '/' ? `/${newName}` : `${parentPath}/${newName}`;
      }
      if (p.startsWith(oldPath + '/')) {
        const parentPath = getParentPath(oldPath);
        const newBasePath = parentPath === '/' ? `/${newName}` : `${parentPath}/${newName}`;
        return p.replace(oldPath, newBasePath);
      }
      return p;
    }));
    
    if (activeFile === oldPath) {
      const parentPath = getParentPath(oldPath);
      setActiveFile(parentPath === '/' ? `/${newName}` : `${parentPath}/${newName}`);
    } else if (activeFile?.startsWith(oldPath + '/')) {
      const parentPath = getParentPath(oldPath);
      const newBasePath = parentPath === '/' ? `/${newName}` : `${parentPath}/${newName}`;
      setActiveFile(activeFile.replace(oldPath, newBasePath));
    }
  }, [activeFile]);

  const moveNode = useCallback((sourcePath: string, targetPath: string) => {
    if (sourcePath === '/') {
      console.error('Cannot move root');
      return;
    }
    
    setFiles(prevFiles => {
      const newFiles = { ...prevFiles };
      const node = findNodeInTree(newFiles, sourcePath);
      const targetParent = findNodeInTree(newFiles, targetPath);
      
      if (!node || !targetParent || targetParent.type !== 'folder') {
        console.error('Invalid move operation');
        return prevFiles;
      }
      
      // Check if target already has a node with the same name
      const newPath = `${targetPath}/${node.name}`;
      if (findNodeInTree(newFiles, newPath)) {
        console.error('A node with this name already exists in target');
        return prevFiles;
      }
      
      // Remove from old parent
      const oldParent = findParentNode(newFiles, sourcePath);
      if (oldParent) {
        removeFromParent(oldParent, sourcePath);
      }
      
      // Update paths
      updatePathsInSubtree(node, newPath);
      
      // Add to new parent
      addToParent(targetParent, node);
      
      return newFiles;
    });
    
    // Update open files and active file
    setOpenFiles(prev => prev.map(p => {
      if (p === sourcePath) {
        const targetParent = findNodeInTree(files, targetPath);
        if (targetParent) {
          return `${targetPath}/${getNameFromPath(sourcePath)}`;
        }
      }
      if (p.startsWith(sourcePath + '/')) {
        const targetParent = findNodeInTree(files, targetPath);
        if (targetParent) {
          const relativePath = p.substring(sourcePath.length);
          return `${targetPath}${relativePath}`;
        }
      }
      return p;
    }));
  }, [files]);

  const copyNode = useCallback((sourcePath: string, targetPath: string) => {
    setFiles(prevFiles => {
      const newFiles = { ...prevFiles };
      const node = findNodeInTree(newFiles, sourcePath);
      const targetParent = findNodeInTree(newFiles, targetPath);
      
      if (!node || !targetParent || targetParent.type !== 'folder') {
        console.error('Invalid copy operation');
        return prevFiles;
      }
      
      // Generate new name if needed
      let newName = node.name;
      let newPath = `${targetPath}/${newName}`;
      let counter = 1;
      
      while (findNodeInTree(newFiles, newPath)) {
        const nameParts = node.name.split('.');
        if (nameParts.length > 1) {
          const ext = nameParts.pop();
          const baseName = nameParts.join('.');
          newName = `${baseName}-${counter}.${ext}`;
        } else {
          newName = `${node.name}-${counter}`;
        }
        newPath = `${targetPath}/${newName}`;
        counter++;
      }
      
      // Clone node
      const cloned = cloneNode(node);
      cloned.name = newName;
      updatePathsInSubtree(cloned, newPath);
      
      // Add to target parent
      addToParent(targetParent, cloned);
      
      return newFiles;
    });
  }, []);

  const updateFileContent = useCallback((path: string, content: string) => {
    setFiles(prevFiles => {
      const newFiles = { ...prevFiles };
      const node = findNodeInTree(newFiles, path);
      
      if (!node || node.type !== 'file') {
        console.error('Cannot update content: file not found');
        return prevFiles;
      }
      
      // Check disk space for the size difference
      const oldSize = (node.content || '').length;
      const newSize = content.length;
      const sizeDiff = newSize - oldSize;
      
      if (sizeDiff > 0 && !checkDiskSpace(sizeDiff)) {
        triggerFileError(
          'Cannot save file. There is not enough space on the disk.',
          '0x80070070'
        );
        return prevFiles;
      }

      // Check if approaching disk limit (80%)
      const usageAfterUpdate = diskSpaceUsed + sizeDiff;
      if (usageAfterUpdate > diskSpaceLimit * 0.8 && diskSpaceUsed <= diskSpaceLimit * 0.8) {
        setShowDiskWarning(true);
        window.dispatchEvent(new CustomEvent('disk-warning', {
          detail: { used: usageAfterUpdate, limit: diskSpaceLimit }
        }));
      }
      
      node.content = content;
      node.modified = new Date();
      
      return newFiles;
    });
  }, [checkDiskSpace, diskSpaceUsed, diskSpaceLimit, triggerFileError]);

  const getFileContent = useCallback((path: string): string | null => {
    const node = findNode(path);
    if (node && node.type === 'file') {
      return node.content || '';
    }
    return null;
  }, [findNode]);

  const openFile = useCallback((path: string) => {
    setOpenFiles(prev => {
      if (!prev.includes(path)) {
        return [...prev, path];
      }
      return prev;
    });
    setActiveFile(path);
  }, []);

  const closeFile = useCallback((path: string) => {
    setOpenFiles(prev => prev.filter(p => p !== path));
    if (activeFile === path) {
      const remaining = openFiles.filter(p => p !== path);
      setActiveFile(remaining.length > 0 ? remaining[remaining.length - 1] : null);
    }
  }, [activeFile, openFiles]);

  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  }, []);

  const value: FileSystemContextType = {
    files,
    openFiles,
    activeFile,
    expandedFolders,
    diskSpaceUsed,
    diskSpaceLimit,
    fileAssociations,
    showSaveAsDialog,
    showOpenDialog,
    showFileAssociationDialog,
    showPropertiesDialog,
    showDiskWarning,
    showErrorDialog,
    errorDialogMessage,
    errorDialogCode,
    selectedFileForProperties,
    pendingFileForAssociation,
    createFile,
    createFolder,
    deleteNode,
    renameNode,
    moveNode,
    copyNode,
    updateFileContent,
    getFileContent,
    openFile,
    closeFile,
    setActiveFile,
    toggleFolder,
    findNode,
    getNodeByPath,
    calculateDiskSpace,
    checkDiskSpace,
    setFileAssociation,
    getFileAssociation,
    triggerSaveAsDialog,
    triggerOpenDialog,
    triggerFileError,
    getFileProperties,
    setShowSaveAsDialog,
    setShowOpenDialog,
    setShowFileAssociationDialog,
    setShowPropertiesDialog,
    setShowDiskWarning,
    setShowErrorDialog,
    setSelectedFileForProperties,
  };

  return (
    <FileSystemContext.Provider value={value}>
      {children}
    </FileSystemContext.Provider>
  );
};

