import { useEffect } from 'react';

/**
 * Best-effort screenshot prevention for classroom pages.
 * - Disables right-click context menu
 * - Intercepts PrintScreen + common screenshot shortcuts
 * - Applies user-select: none via CSS
 * - Adds a visible watermark overlay with user name + time
 */
export function useScreenshotPrevention(userName: string) {
  useEffect(() => {
    // Disable context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Intercept screenshot keys
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        showNagToast();
        return;
      }
      // Windows: Win+Shift+S (Snipping Tool)
      if (e.key === 's' && e.shiftKey && e.metaKey) {
        e.preventDefault();
        showNagToast();
        return;
      }
      // Mac: Cmd+Shift+3 or Cmd+Shift+4
      if (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) {
        e.preventDefault();
        showNagToast();
        return;
      }
    };

    // Apply CSS protections
    document.body.style.userSelect = 'none';
    document.body.style.setProperty('-webkit-user-select', 'none');

    // Create watermark overlay
    const watermark = document.createElement('div');
    watermark.id = 'classroom-watermark';
    watermark.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      pointer-events: none; z-index: 99999; opacity: 0.06;
      display: flex; flex-wrap: wrap; align-items: center; justify-content: center;
      gap: 80px; padding: 40px; overflow: hidden;
      font-family: 'Inter', sans-serif;
    `;
    const text = `${userName} • ${new Date().toLocaleString()}`;
    for (let i = 0; i < 20; i++) {
      const span = document.createElement('span');
      span.textContent = text;
      span.style.cssText = `
        font-size: 14px; color: #000; transform: rotate(-30deg);
        white-space: nowrap; letter-spacing: 2px; font-weight: 600;
      `;
      watermark.appendChild(span);
    }
    document.body.appendChild(watermark);

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.userSelect = '';
      document.body.style.removeProperty('-webkit-user-select');
      const el = document.getElementById('classroom-watermark');
      if (el) el.remove();
    };
  }, [userName]);
}

function showNagToast() {
  const existing = document.getElementById('screenshot-nag');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'screenshot-nag';
  toast.textContent = '🚫 Screenshots are not allowed during class sessions';
  toast.style.cssText = `
    position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
    background: #dc2626; color: #fff; padding: 12px 24px; border-radius: 12px;
    font-size: 14px; font-weight: 600; z-index: 100000; box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    animation: slideUp 0.3s ease-out;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
