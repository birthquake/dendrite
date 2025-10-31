import { useEffect } from 'react';
import { X } from 'lucide-react';
import './keyboard-shortcuts-modal.css';

const shortcuts = [
  { keys: ['Ctrl/Cmd', 'S'], description: 'Save note' },
  { keys: ['Ctrl/Cmd', 'N'], description: 'New note' },
  { keys: ['Escape'], description: 'Cancel edit' },
  { keys: ['[', '['], description: 'Start linking notes' },
  { keys: ['Ctrl/Cmd', '/'], description: 'Show shortcuts' },
];

export function KeyboardShortcutsModal({ isOpen, onClose }) {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="keyboard-shortcuts-overlay" onClick={onClose}>
      {/* Backdrop */}
      <div className="keyboard-shortcuts-backdrop" />

      {/* Modal */}
      <div
        className="keyboard-shortcuts-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="keyboard-shortcuts-header">
          <h2>Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="keyboard-shortcuts-close"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="keyboard-shortcuts-content">
          <div className="keyboard-shortcuts-grid">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="keyboard-shortcut-item">
                <span className="shortcut-description">
                  {shortcut.description}
                </span>
                <div className="shortcut-keys">
                  {shortcut.keys.map((key, keyIndex) => (
                    <div key={keyIndex} className="key-group">
                      <kbd className="keyboard-key">{key}</kbd>
                      {keyIndex < shortcut.keys.length - 1 && (
                        <span className="key-plus">+</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer hint */}
          <div className="keyboard-shortcuts-footer">
            <p>
              Press <kbd className="keyboard-key keyboard-key-highlight">Esc</kbd> or
              click outside to close
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
