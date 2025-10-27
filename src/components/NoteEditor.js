import { useState, useEffect, useRef } from 'react';
import './NoteEditor.css';

function NoteEditor({ 
  note, 
  allNotes = [], 
  onCreate, 
  onSave, 
  onDelete,
  getNoteByTitle,
  getBacklinks,
  createNoteIfNotExists
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(!note);
  const [linkedNotes, setLinkedNotes] = useState([]);
  
  // Autocomplete state
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cursorPos, setCursorPos] = useState(0);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setLinkedNotes(note.linkedNotes || []);
      setIsEditing(false);
    } else {
      setTitle('');
      setContent('');
      setLinkedNotes([]);
      setIsEditing(true);
    }
  }, [note]);

  // ===== AUTOCOMPLETE LOGIC =====

  // Detect if user is typing [[ and show autocomplete
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    setCursorPos(e.target.selectionStart);

    // Look for [[ pattern before cursor
    const textBeforeCursor = newContent.substring(0, e.target.selectionStart);
    const lastBracketIndex = textBeforeCursor.lastIndexOf('[[');
    
    if (lastBracketIndex !== -1) {
      // Check if there's a closing ]] after cursor
      const textAfterLastBracket = textBeforeCursor.substring(lastBracketIndex + 2);
      
      if (!textAfterLastBracket.includes(']]')) {
        // User is actively typing a link
        setSearchTerm(textAfterLastBracket);
        filterNotesForAutocomplete(textAfterLastBracket);
        setShowAutocomplete(true);
      } else {
        setShowAutocomplete(false);
      }
    } else {
      setShowAutocomplete(false);
    }
  };

  // Filter notes based on search term
  const filterNotesForAutocomplete = (search) => {
    if (!search.trim()) {
      setAutocompleteResults(allNotes);
      return;
    }

    const filtered = allNotes.filter(n =>
      n.title.toLowerCase().includes(search.toLowerCase())
    );
    setAutocompleteResults(filtered);
  };

  // Insert link into content
  const insertLink = async (noteTitleToLink) => {
    if (!textareaRef.current) return;

    // Find the [[ in the content
    const textBeforeCursor = content.substring(0, cursorPos);
    const lastBracketIndex = textBeforeCursor.lastIndexOf('[[');

    if (lastBracketIndex === -1) return;

    // Check if note exists, if not create it
    let linkNoteId = null;
    const existingNote = getNoteByTitle(noteTitleToLink);
    
    if (existingNote) {
      linkNoteId = existingNote.id;
    } else {
      // Create the note if it doesn't exist
      linkNoteId = await createNoteIfNotExists(noteTitleToLink);
    }

    // Replace [[ search term ]] with [[ note title ]]
    const beforeLink = content.substring(0, lastBracketIndex);
    const afterLink = content.substring(cursorPos);
    const newContent = beforeLink + '[[' + noteTitleToLink + ']]' + afterLink;

    setContent(newContent);

    // Add to linkedNotes if not already there
    if (linkNoteId && !linkedNotes.includes(linkNoteId)) {
      setLinkedNotes([...linkedNotes, linkNoteId]);
    }

    setShowAutocomplete(false);
    setSearchTerm('');

    // Focus back on textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = beforeLink.length + 2 + noteTitleToLink.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // ===== END AUTOCOMPLETE LOGIC =====

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      alert('Please fill in both title and content');
      return;
    }

    if (note) {
      onSave(note.id, title, content, linkedNotes);
    } else {
      onCreate(title, content);
      setTitle('');
      setContent('');
      setLinkedNotes([]);
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
          <div className="editor-textarea-wrapper">
            <textarea
              ref={textareaRef}
              className="editor-content"
              placeholder="Start writing... Type [[ to link notes"
              value={content}
              onChange={handleContentChange}
            />
            
            {/* AUTOCOMPLETE DROPDOWN */}
            {showAutocomplete && (
              <div className="autocomplete-dropdown">
                {autocompleteResults.length > 0 ? (
                  autocompleteResults.map(resultNote => (
                    <div
                      key={resultNote.id}
                      className="autocomplete-item"
                      onClick={() => insertLink(resultNote.title)}
                    >
                      <span className="autocomplete-title">{resultNote.title}</span>
                      <span className="autocomplete-preview">
                        {resultNote.content?.substring(0, 30)}...
                      </span>
                    </div>
                  ))
                ) : (
                  <div
                    className="autocomplete-item autocomplete-create"
                    onClick={() => insertLink(searchTerm)}
                  >
                    <span className="autocomplete-title">+ Create "{searchTerm}"</span>
                  </div>
                )}
              </div>
            )}
          </div>

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
