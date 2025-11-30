import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Note: If you see "Cannot redefine property: ethereum" errors in the console,
// these are from browser extensions (like MetaMask) and won't affect this app.
// They can be safely ignored.

// Create root and render React first - do this immediately without any DOM manipulation
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

// After React renders, load Clippy CSS and JS
// Use requestIdleCallback or setTimeout to ensure React is fully initialized
const initClippy = () => {
  // Load CSS
  if (!document.querySelector('link[href*="clippy.css"]')) {
    const clippyCSS = document.createElement('link');
    clippyCSS.rel = 'stylesheet';
    clippyCSS.href = 'https://cdn.jsdelivr.net/gh/pi0/clippyjs@master/assets/clippy.css';
    document.head.appendChild(clippyCSS);
  }

  // Load Clippy.js using script tag to avoid ES module import issues with jQuery
  const loadClippy = () => {
    if (typeof (window as any).jQuery === 'undefined' && typeof (window as any).$ === 'undefined') {
      setTimeout(loadClippy, 50);
      return;
    }

    // Check if already loaded
    if (typeof (window as any).clippy !== 'undefined') {
      console.log('✅ Clippy.js already loaded');
      return;
    }

    // Set CLIPPY_CDN to use jsDelivr instead of gitcdn.xyz (which is unreliable)
    (window as any).CLIPPY_CDN = 'https://cdn.jsdelivr.net/gh/pi0/clippyjs@master/assets/agents/';
    console.log('✅ Set CLIPPY_CDN to:', (window as any).CLIPPY_CDN);

    // Load the non-ES module version using a script tag
    // This works with globally loaded jQuery
    const script = document.createElement('script');
    script.type = 'text/javascript';
    // Load from public folder (copied from node_modules)
    script.src = '/clippy.js';
    script.onload = () => {
      // Give it a moment for window.clippy to be set
      setTimeout(() => {
        console.log('✅ Clippy.js script loaded, window.clippy:', typeof (window as any).clippy);
        if (typeof (window as any).clippy === 'undefined') {
          console.warn('⚠️ Script loaded but window.clippy is still undefined');
        }
      }, 100);
    };
    script.onerror = (error) => {
      console.error('❌ Failed to load Clippy.js script from /clippy.js:', error);
      console.log('💡 Make sure clippy.js is in the public folder');
    };
    document.head.appendChild(script);
  };
  
  loadClippy();
};

// Wait for React to be fully ready
if (typeof requestIdleCallback !== 'undefined') {
  requestIdleCallback(initClippy, { timeout: 500 });
} else {
  setTimeout(initClippy, 300);
}
