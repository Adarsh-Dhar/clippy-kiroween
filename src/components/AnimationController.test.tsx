import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnimationController } from './AnimationController';

describe('AnimationController', () => {
  it('renders all four buttons with correct labels', () => {
    const mockTrigger = vi.fn();
    render(<AnimationController onAnimationTrigger={mockTrigger} />);

    expect(screen.getByText('Wave')).toBeInTheDocument();
    expect(screen.getByText('Write')).toBeInTheDocument();
    expect(screen.getByText('Confused')).toBeInTheDocument();
    expect(screen.getByText('Idle')).toBeInTheDocument();
  });

  it('calls onAnimationTrigger with "Wave" when Wave button is clicked', () => {
    const mockTrigger = vi.fn();
    render(<AnimationController onAnimationTrigger={mockTrigger} />);

    fireEvent.click(screen.getByText('Wave'));
    expect(mockTrigger).toHaveBeenCalledWith('Wave');
  });

  it('calls onAnimationTrigger with "Writing" when Write button is clicked', () => {
    const mockTrigger = vi.fn();
    render(<AnimationController onAnimationTrigger={mockTrigger} />);

    fireEvent.click(screen.getByText('Write'));
    expect(mockTrigger).toHaveBeenCalledWith('Writing');
  });

  it('calls onAnimationTrigger with "GetAttention" when Confused button is clicked', () => {
    const mockTrigger = vi.fn();
    render(<AnimationController onAnimationTrigger={mockTrigger} />);

    fireEvent.click(screen.getByText('Confused'));
    expect(mockTrigger).toHaveBeenCalledWith('GetAttention');
  });

  it('calls onAnimationTrigger with "Idle1_1" when Idle button is clicked', () => {
    const mockTrigger = vi.fn();
    render(<AnimationController onAnimationTrigger={mockTrigger} />);

    fireEvent.click(screen.getByText('Idle'));
    expect(mockTrigger).toHaveBeenCalledWith('Idle1_1');
  });

  it('applies Windows 95 styling classes', () => {
    const mockTrigger = vi.fn();
    render(<AnimationController onAnimationTrigger={mockTrigger} />);

    const button = screen.getByText('Wave');
    expect(button).toHaveClass('bg-gray-400');
    expect(button).toHaveClass('border-2');
  });
});
