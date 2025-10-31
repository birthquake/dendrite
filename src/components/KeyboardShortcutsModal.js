import { useEffect } from 'react';
import { X } from 'lucide-react';

const shortcuts = [
  { keys: ['Ctrl', 'S'], description: 'Save note' },
  { keys: ['Cmd', 'S'], description: 'Save note' },
  { keys: ['Ctrl', 'N'], description: 'New note' },
  { keys: ['Cmd', 'N'], description: 'New note' },
  { keys: ['Escape'], description: 'Cancel edit' },
  { keys: ['[', '['], description: 'Start linking notes' },
  { keys: ['?'], description: 'Show shortcuts' },
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
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" />
      {/* Modal */}
      <div
        className="relative bg-[#1a1a1a] border border-gray-800 rounded-xl shadow-2xl max-w-2xl w-full animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800 rounded-lg"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-4 p-3 rounded-lg hover:bg-[#0f0f0f] transition-colors"
              >
                <span className="text-gray-300 text-sm">{shortcut.description}</span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {shortcut.keys.map((key, keyIndex) => (
                    <div key={keyIndex} className="flex items-center gap-1.5">
                      <kbd className="px-2.5 py-1.5 text-xs font-semibold text-gray-200 bg-gray-800 border border-gray-700 rounded-md shadow-sm min-w-[2rem] text-center">
                        {key}
                      </kbd>
                      {keyIndex < shortcut.keys.length - 1 && (
                        <span className="text-gray-600 text-xs">+</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* Footer hint */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-center text-sm text-gray-500">
              Press{' '}
              <kbd className="px-2 py-1 text-xs font-semibold text-[#6366f1] bg-[#6366f1]/10 border border-[#6366f1]/30 rounded">
                Escape
              </kbd>
              {' '}or click outside to close
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
