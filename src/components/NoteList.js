import { useState } from 'react';
import './NoteList.css';

function NoteList({ notes, selectedNote, onSelectNote, onCreateNewNote }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter notes based on search term
  const filteredNotes = notes.filter(note => {
    const title = note.title?.toLowerCase() || '';
    const content = note.content?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    
    return title.includes(search) || content.includes(search);
  });

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="note-list">
      <div className="note-list-header">
        <h2>Your Notes</h2>
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

      <div className="notes-container">
        {filteredNotes.length === 0 ? (
          <p className="empty-state">
            {searchTerm ? 'No notes match your search.' : 'No notes yet. Create one to get started!'}
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
            </div>
          ))
        )}
      </div>

      <button className="new-note-btn" onClick={onCreateNewNote}>
        + New Note
      </button>
    </div>
  );
}

export default NoteList;
