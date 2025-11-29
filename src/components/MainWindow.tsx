import { TitleBar } from './TitleBar';
import { MenuBar } from './MenuBar';
import { EditorArea } from './EditorArea';
import { ClippyAgent } from './ClippyAgent';

interface MainWindowProps {
  anger: number;
  code: string;
  onCodeChange: (code: string) => void;
  onCompile: () => void;
  clippyMessage: string;
  buttonPosition?: { x: number; y: number };
  onButtonMouseEnter?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const MainWindow = ({
  anger,
  code,
  onCodeChange,
  onCompile,
  clippyMessage,
  buttonPosition,
  onButtonMouseEnter,
}: MainWindowProps) => {
  let windowBgColor = 'bg-win95-gray';
  let windowBorderColor = 'border-win95-gray';

  if (anger >= 2) {
    windowBgColor = 'bg-gray-700';
  }

  return (
    <div className={`relative w-full max-w-3xl ${windowBgColor} border-2 border-solid`}
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
      <div className={`p-4 ${anger === 1 ? 'animate-shake' : ''}`}>
        <EditorArea anger={anger} value={code} onChange={onCodeChange} />
        <div className="mt-4 flex gap-2">
          <button
            onClick={onCompile}
            onMouseEnter={onButtonMouseEnter}
            style={
              anger === 3 && buttonPosition
                ? { position: 'absolute', left: `${buttonPosition.x}px`, top: `${buttonPosition.y}px` }
                : {}
            }
            className="win95-button"
          >
            Check Syntax
          </button>
        </div>
      </div>
      <ClippyAgent anger={anger} message={clippyMessage} />
    </div>
  );
};
