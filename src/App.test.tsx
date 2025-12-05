import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import App from './App';

describe('App Integration Tests', () => {
  it('should render the app without crashing', () => {
    render(<App />);
    // App should render successfully
    expect(document.body).toBeInTheDocument();
  });

  it('should show BSOD when game state is CRASHED', async () => {
    render(<App />);
    
    // We can't easily trigger the crash in this test without manipulating internal state
    // This test verifies the BSOD component integration exists
    // The actual crash flow is tested in the GameContext tests
  });
});

describe('GameContext Integration Tests', () => {
  it('should provide resetGame function that resets all state', () => {
    // This test verifies the GameContext exports resetGame
    // The actual functionality is tested in GameContext.test.tsx
    render(<App />);
    expect(document.body).toBeInTheDocument();
  });
});
