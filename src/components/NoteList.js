import { useState, useEffect, useMemo } from 'react';
import './NoteList.css';

function NoteList({ 
  notes, 
  selectedNote, 
  onSelectNote, 
  onCreateNewNote, 
  allTags = [],
  sortBy = 'date-created',
  onSortChange
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  // Debounce search term (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter and sort notes based on debounced search term, selected tags, and sort preference
  const filteredNotes = useMemo(() => {
    let result = notes.filter(note => {
      const title = note.title?.toLowerCase() || '';
      const content = note.content?.toLowerCase() || '';
      const search = debouncedSearchTerm.toLowerCase();
      
      // Check search term match
      const matchesSearch = title.includes(search) || content.includes(search);
      
      // Check tag match (if tags are selected, note must have at least one selected tag)
      const matchesTags = selectedTags.length === 0 || 
        (note.tags && note.tags.some(tag => selectedTags.includes(tag)));
      
      return matchesSearch && matchesTags;
    });

    // Apply sorting
    switch (sortBy) {
      case 'title-asc':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'most-tags':
        result.sort((a, b) => {
          const aTagCount = a.tags ? a.tags.length : 0;
          const bTagCount = b.tags ? b.tags.length : 0;
          return bTagCount - aTagCount;
        });
        break;
      case 'date-created':
      default:
        result.sort((a, b) => {
          const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
          const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
          return bDate - aDate;
        });
    }

    return result;
  }, [notes, debouncedSearchTerm, selectedTags, sortBy]);

  const clearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
  };

  const toggleTagFilter = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const clearTagFilters = () => {
    setSelectedTags([]);
  };

  return (
    <div className="note-list">
      <div className="note-list-header">
        <h2>Your Notes</h2>
      </div>
      
      {/* SORT DROPDOWN */}
      <div className="sort-container">
        <label htmlFor="sort-select">Sort by:</label>
        <select
          id="sort-select"
          className="sort-select"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
        >
          <option value="date-created">Date Created</option>
          <option value="title-asc">Title A-Z</option>
          <option value="most-tags">Most Tags</option>
        </select>
      </div>
      
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button className="search-clear" onClick={clearSearch}>
            ✕
          </button>
        )}
      </div>
      {searchTerm && (
        <div className="search-results-info">
          {filteredNotes.length} result{filteredNotes.length !== 1 ? 's' : ''}
        </div>
      )}
      {/* TAG FILTER */}
      {allTags.length > 0 && (
        <div className="tag-filter-container">
          <div className="tag-filter-header">
            <span className="tag-filter-label">Filter by tag</span>
            {selectedTags.length > 0 && (
              <button className="tag-filter-clear" onClick={clearTagFilters}>
                Clear
              </button>
            )}
          </div>
          <div className="tag-filter-list">
            {allTags.map(tag => (
              <button
                key={tag}
                className={`tag-filter-item ${selectedTags.includes(tag) ? 'active' : ''}`}
                onClick={() => toggleTagFilter(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="notes-container">
        {filteredNotes.length === 0 ? (
          <p className="empty-state">
            {searchTerm || selectedTags.length > 0
              ? 'No notes match your filters.'
              : 'No notes yet. Create one to get started!'}
          </p>
        ) : (
          filteredNotes.map(note => (
            <div
              key={note.id}
              className={`note-item ${selectedNote?.id === note.id ? 'active' : ''}`}
              onClick={() => onSelectNote(note)}
            >
              <h3>{note.title || 'Untitled'}</h3>
              <p>{note.content?.substring(0, 50)}...</p>
              {note.tags && note.tags.length > 0 && (
                <div className="note-tags">
                  {note.tags.map(tag => (
                    <span key={tag} className="note-tag-small">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <button className="new-note-btn" onClick={onCreateNewNote}>
        + New Note (Ctrl+N)
      </button>
    </div>
  );
}

export default NoteList;
