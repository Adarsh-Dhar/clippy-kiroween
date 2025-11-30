import { createContext, useContext, useState, ReactNode } from 'react';

interface ViewContextType {
  zoom: number;
  fileTreeVisible: boolean;
  lineNumbersVisible: boolean;
  wordWrap: boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setZoom: (zoom: number) => void;
  toggleFileTree: () => void;
  toggleLineNumbers: () => void;
  toggleWordWrap: () => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export const useView = () => {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error('useView must be used within a ViewProvider');
  }
  return context;
};

interface ViewProviderProps {
  children: ReactNode;
}

export const ViewProvider = ({ children }: ViewProviderProps) => {
  const [zoom, setZoomState] = useState(100);
  const [fileTreeVisible, setFileTreeVisible] = useState(true);
  const [lineNumbersVisible, setLineNumbersVisible] = useState(true);
  const [wordWrap, setWordWrap] = useState(false);

  const zoomIn = () => {
    setZoomState(prev => Math.min(prev + 10, 200));
  };

  const zoomOut = () => {
    setZoomState(prev => Math.max(prev - 10, 50));
  };

  const resetZoom = () => {
    setZoomState(100);
  };

  const setZoom = (newZoom: number) => {
    setZoomState(Math.max(50, Math.min(200, newZoom)));
  };

  const toggleFileTree = () => {
    setFileTreeVisible(prev => !prev);
  };

  const toggleLineNumbers = () => {
    setLineNumbersVisible(prev => !prev);
  };

  const toggleWordWrap = () => {
    setWordWrap(prev => !prev);
  };

  const value: ViewContextType = {
    zoom,
    fileTreeVisible,
    lineNumbersVisible,
    wordWrap,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoom,
    toggleFileTree,
    toggleLineNumbers,
    toggleWordWrap,
  };

  return (
    <ViewContext.Provider value={value}>
      {children}
    </ViewContext.Provider>
  );
};

