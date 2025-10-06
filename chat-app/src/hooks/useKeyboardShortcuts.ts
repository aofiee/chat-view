import { useEffect } from 'react';

interface UseKeyboardShortcutsProps {
  onScrollToTop: () => void;
  onRefresh: () => void;
}

export function useKeyboardShortcuts({ onScrollToTop, onRefresh }: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if user is not typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Scroll to top with Home key or Ctrl/Cmd + Up Arrow
      if (event.key === 'Home' || (event.key === 'ArrowUp' && (event.metaKey || event.ctrlKey))) {
        event.preventDefault();
        onScrollToTop();
      }

      // Refresh with F5 or Ctrl/Cmd + R
      if (event.key === 'F5' || (event.key === 'r' && (event.metaKey || event.ctrlKey))) {
        event.preventDefault();
        onRefresh();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onScrollToTop, onRefresh]);
}