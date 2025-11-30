import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BSOD } from './BSOD';

describe('BSOD Component', () => {
  let reloadSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock window.location.reload
    reloadSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadSpy },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render with correct blue background color', () => {
    const { container } = render(<BSOD />);
    const bsodDiv = container.firstChild as HTMLElement;
    
    expect(bsodDiv).toHaveStyle({ backgroundColor: '#0000AA' });
  });

  it('should display WINDOWS header with white background', () => {
    render(<BSOD />);
    const windowsHeader = screen.getByText('WINDOWS');
    
    expect(windowsHeader).toBeInTheDocument();
    expect(windowsHeader).toHaveStyle({ backgroundColor: '#FFFFFF', color: '#0000AA' });
  });

  it('should display fatal exception message with CLIPPY reference', () => {
    render(<BSOD />);
    
    expect(screen.getByText(/A fatal exception 0E has occurred at 0028:C0011E36 in VXD CLIPPY\(01\)/)).toBeInTheDocument();
  });

  it('should display termination message', () => {
    render(<BSOD />);
    
    expect(screen.getByText('The current application has been terminated.')).toBeInTheDocument();
  });

  it('should display instruction text', () => {
    render(<BSOD />);
    
    expect(screen.getByText(/Press any key to terminate the current application/)).toBeInTheDocument();
  });

  it('should reload page when any key is pressed', () => {
    render(<BSOD />);
    
    fireEvent.keyDown(window, { key: 'Enter' });
    
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });

  it('should reload page when clicked', () => {
    render(<BSOD />);
    
    fireEvent.click(window);
    
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });

  it('should have highest z-index', () => {
    const { container } = render(<BSOD />);
    const bsodDiv = container.firstChild as HTMLElement;
    
    expect(bsodDiv.className).toContain('z-[9999]');
  });

  it('should use Courier New font', () => {
    const { container } = render(<BSOD />);
    const bsodDiv = container.firstChild as HTMLElement;
    
    expect(bsodDiv).toHaveStyle({ fontFamily: "'Courier New', monospace" });
  });
});
