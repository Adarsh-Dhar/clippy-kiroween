import { useEffect } from 'react';

export const BSOD = () => {
  useEffect(() => {
    const handleInteraction = () => {
      window.location.reload();
    };

    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('click', handleInteraction);

    return () => {
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('click', handleInteraction);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] text-white font-bold p-8"
      style={{
        backgroundColor: '#0000AA',
        fontFamily: "'Courier New', monospace",
      }}
    >
      <div className="text-center mb-8">
        <span
          className="px-4 py-1 inline-block"
          style={{
            backgroundColor: '#FFFFFF',
            color: '#0000AA',
          }}
        >
          WINDOWS
        </span>
      </div>
      <div className="space-y-4">
        <p>A fatal exception 0E has occurred at 0028:C0011E36 in VXD CLIPPY(01).</p>
        <p>The current application has been terminated.</p>
        <p className="mt-8">
          * Press any key to terminate the current application.
          <br />
          * Press CTRL+ALT+DEL again to restart your computer. You will
          <br />
          &nbsp;&nbsp;lose any unsaved information in all applications.
        </p>
        <p className="mt-8">Press any key to continue _</p>
      </div>
    </div>
  );
};
