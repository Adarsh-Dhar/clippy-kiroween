import { useState } from 'react';
import { TitleBar } from './TitleBar';
import { MenuBar } from './MenuBar';
import { EditorArea } from './EditorArea';
import { ClippyAgent } from './ClippyAgent';
import { LanguageSelector } from './LanguageSelector';
import { FileTree } from './FileTree';
import { FileTabs } from './FileTabs';
import { ValidationError } from '../utils/codeValidator';
import { useView } from '../contexts/ViewContext';

interface MainWindowProps {
  anger: number;
  clippyMessage: string;
  onAngerChange?: (angerLevel: number) => void;
  onErrorCountChange?: (errorCount: number) => void;
}

export const MainWindow = ({
  anger,
  clippyMessage,
  onAngerChange,
  onErrorCountChange,
}: MainWindowProps) => {
  const { fileTreeVisible } = useView();
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isLinting, setIsLinting] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  let windowBgColor = 'bg-win95-gray';
  let windowBorderColor = 'border-win95-gray';

  if (anger >= 2) {
    windowBgColor = 'bg-gray-700';
  }

  return (
    <div className={`relative w-full h-[90vh] max-w-7xl ${windowBgColor} border-2 border-solid flex flex-col`}
      style={{
        borderLeftColor: anger >= 2 ? '#999' : '#ffffff',
        borderTopColor: anger >= 2 ? '#999' : '#ffffff',
        borderRightColor: anger >= 2 ? '#333' : '#808080',
        borderBottomColor: anger >= 2 ? '#333' : '#000000',
        boxShadow: anger >= 2 ? 'inset 1px 1px 0 0 #999, inset -1px -1px 0 0 #333' : 'inset 1px 1px 0 0 #ffffff, inset -1px -1px 0 0 #808080'
      }}>
      <TitleBar
        title="Microsoft Word 97 - Developer Edition [Read-Only]"
        closeDisabled={true}
      />
      <MenuBar />
      <div className="flex flex-1 overflow-hidden">
        {/* File Tree Sidebar */}
        {fileTreeVisible && (
          <div className="w-64 flex-shrink-0">
            <FileTree />
          </div>
        )}
        
        {/* Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="mb-2 p-2">
            <LanguageSelector 
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
            />
          </div>
          <FileTabs />
          <div className="flex-1 overflow-hidden p-2">
            <EditorArea 
              anger={anger} 
              onAngerChange={onAngerChange}
              onErrorCountChange={onErrorCountChange}
              onErrorsChange={setErrors}
              onLintingChange={setIsLinting}
              selectedLanguage={selectedLanguage}
            />
          </div>
        </div>
      </div>
      <ClippyAgent anger={anger} message={clippyMessage || ''} errors={errors} isLinting={isLinting} />
    </div>
  );
};
