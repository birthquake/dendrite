import { useState, useEffect } from 'react';
import './NoteEditor.css';

function NoteEditor({ note, onCreate, onSave, onDelete }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(!note);

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setIsEditing(false);
    } else {
      setTitle('');
      setContent('');
      setIsEditing(true);
    }
  }, [note]);

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      alert('Please fill in both title and content');
      return;
    }

    if (note) {
      onSave(note.id, title, content);
    } else {
      onCreate(title, content);
      setTitle('');
      setContent('');
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      onDelete(note.id);
    }
  };

  if (!note && !isEditing) {
    return <div className="editor-empty">Select a note or create a new one</div>;
  }

  return (
    <div className="note-editor">
      {isEditing ? (
        <>
          <input
            type="text"
            className="editor-title"
            placeholder="Note title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <textarea
            className="editor-content"
            placeholder="Start writing..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="editor-actions">
            <button className="save-btn" onClick={handleSave}>
              Save
            </button>
            {note && (
              <button className="cancel-btn" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="note-header">
            <h1>{title}</h1>
            <div className="note-actions">
              <button className="edit-btn" onClick={() => setIsEditing(true)}>
                Edit
              </button>
              <button className="delete-btn" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
          <div className="note-content">
            {content}
          </div>
        </>
      )}
    </div>
  );
}

export default NoteEditor;
