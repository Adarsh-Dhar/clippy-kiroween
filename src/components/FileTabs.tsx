import { useFileSystem } from '../contexts/FileSystemContext';

export const FileTabs = () => {
  const { openFiles, activeFile, setActiveFile, closeFile } = useFileSystem();

  const getFileName = (path: string): string => {
    const parts = path.split('/').filter(p => p);
    return parts[parts.length - 1] || path;
  };

  const handleTabClick = (path: string) => {
    setActiveFile(path);
  };

  const handleCloseClick = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    closeFile(path);
  };

  if (openFiles.length === 0) {
    return null;
  }

  return (
    <div className="flex bg-win95-gray border-b-2 border-win95-darkgray overflow-x-auto">
      {openFiles.map((path) => {
        const isActive = activeFile === path;
        const fileName = getFileName(path);

        return (
          <div
            key={path}
            className={`flex items-center px-3 py-1 cursor-pointer select-none text-sm font-win95 border-r-2 border-win95-darkgray whitespace-nowrap ${
              isActive
                ? 'bg-win95-cream border-b-2 border-b-win95-cream -mb-0.5'
                : 'bg-win95-gray hover:bg-win95-lightgray'
            }`}
            style={{
              borderLeftColor: isActive ? '#808080' : '#ffffff',
              borderTopColor: isActive ? '#808080' : '#ffffff',
              borderRightColor: isActive ? '#808080' : '#808080',
              borderBottomColor: isActive ? 'transparent' : '#808080',
              boxShadow: isActive
                ? 'inset 1px 1px 0 0 #808080, inset -1px -1px 0 0 #dfdfdf'
                : 'none',
            }}
            onClick={() => handleTabClick(path)}
          >
            <span className="mr-2 truncate max-w-[200px]">{fileName}</span>
            <button
              className="ml-1 w-4 h-4 flex items-center justify-center hover:bg-win95-darkgray text-xs"
              onClick={(e) => handleCloseClick(e, path)}
              onMouseDown={(e) => e.stopPropagation()}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
};

