import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApologyModal } from './ApologyModal';

// Mock Speech Recognition API
class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = '';
  onresult: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onend: (() => void) | null = null;

  // @ts-expect-error - Mock function for testing
  start = vi.fn();
  // @ts-expect-error - Mock function for testing
  stop = vi.fn();
  // @ts-expect-error - Mock function for testing
  abort = vi.fn();
}

describe('ApologyModal Component', () => {
  let mockOnApologyAccepted: ReturnType<typeof vi.fn>;
  let mockOnTimeout: ReturnType<typeof vi.fn>;
  let mockRecognition: MockSpeechRecognition;

  beforeEach(() => {
    mockOnApologyAccepted = vi.fn();
    mockOnTimeout = vi.fn();
    mockRecognition = new MockSpeechRecognition();
    
    // Mock the Speech Recognition API
    (window as any).webkitSpeechRecognition = vi.fn(() => mockRecognition);
    
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Rendering Tests', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <ApologyModal
          isOpen={false}
          onApologyAccepted={mockOnApologyAccepted}
          onTimeout={mockOnTimeout}
        />
      );
      
      expect(container.firstChild).toBeNull();
    });

    it('should render when isOpen is true', () => {
      render(
        <ApologyModal
          isOpen={true}
          onApologyAccepted={mockOnApologyAccepted}
          onTimeout={mockOnTimeout}
        />
      );
      
      const modal = screen.getByText(/SAY IT. SAY YOU ARE SORRY./i);
      expect(modal).toBeInTheDocument();
    });

    it('should have correct overlay styling', () => {
      const { container } = render(
        <ApologyModal
          isOpen={true}
          onApologyAccepted={mockOnApologyAccepted}
          onTimeout={mockOnTimeout}
        />
      );
      
      const overlay = container.firstChild as HTMLElement;
      expect(overlay).toHaveClass('fixed', 'inset-0', 'z-[10000]');
      expect(overlay).toHaveStyle({ backgroundColor: 'rgba(0, 0, 0, 0.95)' });
    });

    it('should display microphone icon in voice mode', () => {
      render(
        <ApologyModal
          isOpen={true}
          onApologyAccepted={mockOnApologyAccepted}
          onTimeout={mockOnTimeout}
        />
      );
      
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '80');
      expect(svg).toHaveAttribute('height', '80');
    });

    it('should display "SAY IT. SAY YOU ARE SORRY." text', () => {
      render(
        <ApologyModal
          isOpen={true}
          onApologyAccepted={mockOnApologyAccepted}
          onTimeout={mockOnTimeout}
        />
      );
      
      expect(screen.getByText('SAY IT. SAY YOU ARE SORRY.')).toBeInTheDocument();
    });
  });

  describe('Speech Recognition Tests', () => {
    it('should initialize speech recognition with correct settings', () => {
      render(
        <ApologyModal
          isOpen={true}
          onApologyAccepted={mockOnApologyAccepted}
          onTimeout={mockOnTimeout}
        />
      );
      
      expect(mockRecognition.continuous).toBe(true);
      expect(mockRecognition.interimResults).toBe(true);
      expect(mockRecognition.lang).toBe('en-US');
      expect(mockRecognition.start).toHaveBeenCalled();
    });

    it('should call onApologyAccepted when "sorry" is detected', () => {
      render(
        <ApologyModal
          isOpen={true}
          onApologyAccepted={mockOnApologyAccepted}
          onTimeout={mockOnTimeout}
        />
      );
      
      // Simulate speech recognition result
      const mockEvent = {
        results: [
          {
            isFinal: true,
            0: { transcript: 'I am sorry' }
          }
        ],
        resultIndex: 0
      };
      
      mockRecognition.onresult?.(mockEvent);
      
      expect(mockOnApologyAccepted).toHaveBeenCalled();
      expect(mockRecognition.stop).toHaveBeenCalled();
    });

    it('should call onApologyAccepted when "apologize" is detected', () => {
      render(
        <ApologyModal
          isOpen={true}
          onApologyAccepted={mockOnApologyAccepted}
          onTimeout={mockOnTimeout}
        />
      );
      
      const mockEvent = {
        results: [
          {
            isFinal: true,
            0: { transcript: 'I apologize' }
          }
        ],
        resultIndex: 0
      };
      
      mockRecognition.onresult?.(mockEvent);
      
      expect(mockOnApologyAccepted).toHaveBeenCalled();
    });

    it('should be case-insensitive for apology detection', () => {
      render(
        <ApologyModal
          isOpen={true}
          onApologyAccepted={mockOnApologyAccepted}
          onTimeout={mockOnTimeout}
        />
      );
      
      const mockEvent = {
        results: [
          {
            isFinal: true,
            0: { transcript: 'I AM SORRY' }
          }
        ],
        resultIndex: 0
      };
      
      mockRecognition.onresult?.(mockEvent);
      
      expect(mockOnApologyAccepted).toHaveBeenCalled();
    });

    it('should not trigger on non-apology words', () => {
      render(
        <ApologyModal
          isOpen={true}
          onApologyAccepted={mockOnApologyAccepted}
          onTimeout={mockOnTimeout}
        />
      );
      
      const mockEvent = {
        results: [
          {
            isFinal: true,
            0: { transcript: 'hello world' }
          }
        ],
        resultIndex: 0
      };
      
      mockRecognition.onresult?.(mockEvent);
      
      expect(mockOnApologyAccepted).not.toHaveBeenCalled();
    });
  });

  describe('Timeout Tests', () => {
    it('should call onTimeout after 5 seconds of silence', () => {
      render(
        <ApologyModal
          isOpen={true}
          onApologyAccepted={mockOnApologyAccepted}
          onTimeout={mockOnTimeout}
        />
      );
      
      vi.advanceTimersByTime(5000);
      
      expect(mockOnTimeout).toHaveBeenCalled();
      expect(mockRecognition.stop).toHaveBeenCalled();
    });

    it('should reset timer when speech is detected', () => {
      render(
        <ApologyModal
          isOpen={true}
          onApologyAccepted={mockOnApologyAccepted}
          onTimeout={mockOnTimeout}
        />
      );
      
      // Advance 3 seconds
      vi.advanceTimersByTime(3000);
      
      // Simulate speech (non-apology)
      const mockEvent = {
        results: [
          {
            isFinal: true,
            0: { transcript: 'hello' }
          }
        ],
        resultIndex: 0
      };
      mockRecognition.onresult?.(mockEvent);
      
      // Advance another 3 seconds (total 6, but timer was reset)
      vi.advanceTimersByTime(3000);
      
      // Should not timeout yet
      expect(mockOnTimeout).not.toHaveBeenCalled();
      
      // Advance 2 more seconds (5 seconds since last speech)
      vi.advanceTimersByTime(2000);
      
      expect(mockOnTimeout).toHaveBeenCalled();
    });

    it('should clear timer when apology is accepted', () => {
      render(
        <ApologyModal
          isOpen={true}
          onApologyAccepted={mockOnApologyAccepted}
          onTimeout={mockOnTimeout}
        />
      );
      
      // Simulate apology
      const mockEvent = {
        results: [
          {
            isFinal: true,
            0: { transcript: 'sorry' }
          }
        ],
        resultIndex: 0
      };
      mockRecognition.onresult?.(mockEvent);
      
      // Advance time
      vi.advanceTimersByTime(10000);
      
      // Timeout should not be called
      expect(mockOnTimeout).not.toHaveBeenCalled();
    });
  });

  describe('Typing Fallback Tests', () => {
    beforeEach(() => {
      // Remove Speech Recognition API
      delete (window as any).webkitSpeechRecognition;
      delete (window as any).SpeechRecognition;
    });

    it('should switch to typing mode when Speech API unavailable', () => {
      render(
        <ApologyModal
          isOpen={true}
          onApologyAccepted={mockOnApologyAccepted}
          onTimeout={mockOnTimeout}
        />
      );
      
      expect(screen.getByText('SPEECH NOT AVAILABLE')).toBeInTheDocument();
      expect(screen.getByText('Type "I am sorry Clippy" 10 times')).toBeInTheDocument();
    });

    it('should display text input field in typing mode', () => {
      render(
        <ApologyModal
          isOpen={true}
          onApologyAccepted={mockOnApologyAccepted}
          onTimeout={mockOnTimeout}
        />
      );
      
      const input = screen.getByPlaceholderText('Type here...');
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass('bg-black', 'text-white', 'border-white');
    });

    it('should display progress counter', () => {
      render(
        <ApologyModal
          isOpen={true}
          onApologyAccepted={mockOnApologyAccepted}
          onTimeout={mockOnTimeout}
        />
      );
      
      expect(screen.getByText('Progress: 0/10')).toBeInTheDocument();
    });

    it('should increment counter on valid submission', () => {
      render(
        <ApologyModal
          isOpen={true}
          onApologyAccepted={mockOnApologyAccepted}
          onTimeout={mockOnTimeout}
        />
      );
      
      const input = screen.getByPlaceholderText('Type here...') as HTMLInputElement;
      const form = input.closest('form')!;
      
      fireEvent.change(input, { target: { value: 'I am sorry Clippy' } });
      fireEvent.submit(form);
      
      expect(screen.getByText('Progress: 1/10')).toBeInTheDocument();
      expect(input.value).toBe('');
    });

    it('should not increment on invalid submission', () => {
      render(
        <ApologyModal
          isOpen={true}
          onApologyAccepted={mockOnApologyAccepted}
          onTimeout={mockOnTimeout}
        />
      );
      
      const input = screen.getByPlaceholderText('Type here...') as HTMLInputElement;
      const form = input.closest('form')!;
      
      fireEvent.change(input, { target: { value: 'wrong phrase' } });
      fireEvent.submit(form);
      
      expect(screen.getByText('Progress: 0/10')).toBeInTheDocument();
    });

    it('should be case-insensitive for typed apology', () => {
      render(
        <ApologyModal
          isOpen={true}
          onApologyAccepted={mockOnApologyAccepted}
          onTimeout={mockOnTimeout}
        />
      );
      
      const input = screen.getByPlaceholderText('Type here...') as HTMLInputElement;
      const form = input.closest('form')!;
      
      fireEvent.change(input, { target: { value: 'I AM SORRY CLIPPY' } });
      fireEvent.submit(form);
      
      expect(screen.getByText('Progress: 1/10')).toBeInTheDocument();
    });

    it('should call onApologyAccepted after 10 valid submissions', () => {
      render(
        <ApologyModal
          isOpen={true}
          onApologyAccepted={mockOnApologyAccepted}
          onTimeout={mockOnTimeout}
        />
      );
      
      const input = screen.getByPlaceholderText('Type here...') as HTMLInputElement;
      const form = input.closest('form')!;
      
      // Submit 10 times
      for (let i = 0; i < 10; i++) {
        fireEvent.change(input, { target: { value: 'I am sorry Clippy' } });
        fireEvent.submit(form);
      }
      
      expect(mockOnApologyAccepted).toHaveBeenCalled();
    });
  });

  describe('Cleanup Tests', () => {
    it('should stop recognition on unmount', () => {
      const { unmount } = render(
        <ApologyModal
          isOpen={true}
          onApologyAccepted={mockOnApologyAccepted}
          onTimeout={mockOnTimeout}
        />
      );
      
      unmount();
      
      expect(mockRecognition.stop).toHaveBeenCalled();
      expect(mockRecognition.abort).toHaveBeenCalled();
    });

    it('should clear timer on unmount', () => {
      const { unmount } = render(
        <ApologyModal
          isOpen={true}
          onApologyAccepted={mockOnApologyAccepted}
          onTimeout={mockOnTimeout}
        />
      );
      
      unmount();
      
      // Advance time after unmount
      vi.advanceTimersByTime(10000);
      
      // Timeout should not be called
      expect(mockOnTimeout).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling Tests', () => {
    it('should switch to typing mode on permission denied', () => {
      render(
        <ApologyModal
          isOpen={true}
          onApologyAccepted={mockOnApologyAccepted}
          onTimeout={mockOnTimeout}
        />
      );
      
      // Simulate permission denied error
      mockRecognition.onerror?.({ error: 'not-allowed' } as any);
      
      waitFor(() => {
        expect(screen.getByText('SPEECH NOT AVAILABLE')).toBeInTheDocument();
      });
    });

    it('should handle no-speech error gracefully', () => {
      render(
        <ApologyModal
          isOpen={true}
          onApologyAccepted={mockOnApologyAccepted}
          onTimeout={mockOnTimeout}
        />
      );
      
      // Simulate no-speech error
      mockRecognition.onerror?.({ error: 'no-speech' } as any);
      
      // Should not crash or switch modes
      expect(screen.getByText('SAY IT. SAY YOU ARE SORRY.')).toBeInTheDocument();
    });
  });
});
