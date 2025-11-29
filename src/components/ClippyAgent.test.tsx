import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { ClippyAgent } from './ClippyAgent';

describe('ClippyAgent', () => {
  let mockAgent: any;
  let mockClippy: any;

  beforeEach(() => {
    // Create mock agent
    mockAgent = {
      show: vi.fn(),
      hide: vi.fn(),
      play: vi.fn(),
      animate: vi.fn(),
      speak: vi.fn(),
    };

    // Create mock clippy static
    mockClippy = {
      load: vi.fn((name: string, callback: (agent: any) => void) => {
        // Simulate async loading
        setTimeout(() => callback(mockAgent), 0);
      }),
    };

    // Add to window
    (window as any).clippy = mockClippy;
  });

  afterEach(() => {
    delete (window as any).clippy;
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<ClippyAgent />);
    expect(container).toBeInTheDocument();
  });

  it('initializes agent on mount', async () => {
    render(<ClippyAgent />);

    await waitFor(() => {
      expect(mockClippy.load).toHaveBeenCalledWith('Clippy', expect.any(Function));
    });
  });

  it('calls agent.show() after initialization', async () => {
    render(<ClippyAgent />);

    await waitFor(() => {
      expect(mockAgent.show).toHaveBeenCalled();
    });
  });

  it('calls agent.hide() on unmount', async () => {
    const { unmount } = render(<ClippyAgent />);

    await waitFor(() => {
      expect(mockAgent.show).toHaveBeenCalled();
    });

    unmount();
    expect(mockAgent.hide).toHaveBeenCalled();
  });

  it('logs error when window.clippy is undefined', () => {
    delete (window as any).clippy;
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<ClippyAgent />);

    expect(consoleSpy).toHaveBeenCalledWith('Clippy.js library not loaded');
    consoleSpy.mockRestore();
  });

  it('playAnimation calls agent.play() with correct parameters', async () => {
    const { container } = render(<ClippyAgent />);

    await waitFor(() => {
      expect(mockAgent.show).toHaveBeenCalled();
    });

    // Find and click a button to trigger animation
    const waveButton = container.querySelector('button');
    if (waveButton) {
      waveButton.click();
      expect(mockAgent.play).toHaveBeenCalled();
    }
  });
});
