import './NoteList.css';

function NoteList({ notes, selectedNote, onSelectNote }) {
  return (
    <div className="note-list">
      <h2>Your Notes</h2>
      <div className="notes-container">
        {notes.length === 0 ? (
          <p className="empty-state">No notes yet. Create one to get started!</p>
        ) : (
          notes.map(note => (
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
      <button className="new-note-btn" onClick={() => onSelectNote(null)}>
        + New Note
      </button>
    </div>
  );
}

export default NoteList;
