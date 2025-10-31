import { useState, useEffect, useRef } from 'react';
import { X, Search } from 'lucide-react';
import './command-palette.css';

export function CommandPalette({ isOpen, onClose, notes, onSelectNote }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef(null);
  const resultsListRef = useRef(null);

  // Filter notes based on search term
  const filteredNotes = searchTerm.trim() === '' 
    ? []
    : notes.filter(note => 
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase())
      );

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredNotes.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredNotes[selectedIndex]) {
          handleSelectNote(filteredNotes[selectedIndex]);
        }
        break;
      default:
        break;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (resultsListRef.current) {
      const selectedElement = resultsListRef.current.querySelector('.command-palette-item.selected');
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleSelectNote = (note) => {
    onSelectNote(note);
    onClose();
    setSearchTerm('');
  };

  if (!isOpen) return null;

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      {/* Backdrop */}
      <div className="command-palette-backdrop" />

      {/* Modal */}
      <div
        className="command-palette-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="command-palette-search">
          <Search size={18} className="command-palette-search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            className="command-palette-input"
            placeholder="Search notes... (Cmd+K)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {searchTerm && (
            <button
              className="command-palette-clear"
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="command-palette-results" ref={resultsListRef}>
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note, index) => (
              <div
                key={note.id}
                className={`command-palette-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => handleSelectNote(note)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="command-palette-item-title">{note.title}</div>
                <div className="command-palette-item-preview">
                  {note.content?.substring(0, 60)}...
                </div>
                {note.tags && note.tags.length > 0 && (
                  <div className="command-palette-item-tags">
                    {note.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="command-palette-tag">
                        {tag}
                      </span>
                    ))}
                    {note.tags.length > 2 && (
                      <span className="command-palette-tag-more">
                        +{note.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : searchTerm ? (
            <div className="command-palette-empty">
              No notes found for "{searchTerm}"
            </div>
          ) : (
            <div className="command-palette-empty">
              Start typing to search notes...
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="command-palette-footer">
          <div className="command-palette-hint">
            <kbd>↑↓</kbd> to navigate
          </div>
          <div className="command-palette-hint">
            <kbd>Enter</kbd> to select
          </div>
          <div className="command-palette-hint">
            <kbd>Esc</kbd> to close
          </div>
        </div>
      </div>
    </div>
  );
}
