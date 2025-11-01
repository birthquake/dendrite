import { useState, useEffect, useRef } from 'react';
import { Edit2, Copy, Trash2, Save, X, BookOpen, Plus } from 'lucide-react';
import './NoteEditor.css';

export function NoteEditor({
  note,
  allNotes,
  onCreate,
  onSave,
  onDelete,
  onDuplicate,
  isCreatingNewNote,
  getNoteByTitle,
  getBacklinks,
  createNoteIfNotExists,
  allTags,
  onSelectNote,
  onCreateNew,
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [isEditing, setIsEditing] = useState(isCreatingNewNote);
  const [linkedNotes, setLinkedNotes] = useState([]);
  const [backlinks, setBacklinks] = useState([]);
  const [autocompleteMatches, setAutocompleteMatches] = useState([]);
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);
  const contentRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [lastSaved, setLastSaved] = useState(null);
  const autoSaveTimeoutRef = useRef(null);

  // Initialize form with note data
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags || []);
      setLinkedNotes(note.linkedNotes || []);
      setBacklinks(getBacklinks(note.id));
      setIsEditing(false);
    } else if (isCreatingNewNote) {
      setTitle('');
      setContent('');
      setTags([]);
      setLinkedNotes([]);
      setBacklinks([]);
      setIsEditing(true);
    }
  }, [note, isCreatingNewNote, getBacklinks]);

  // Auto-save while editing
  useEffect(() => {
    if (isEditing && note) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        onSave(note.id, title, content, linkedNotes, tags);
        setLastSaved(new Date());
      }, 2000);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [content, title, tags, isEditing, note, linkedNotes, onSave]);

  // Listen for save keyboard shortcut
  useEffect(() => {
    const handleSave = () => {
      if (isEditing) {
        handleSaveNote();
      }
    };

    window.addEventListener('save-note', handleSave);
    return () => window.removeEventListener('save-note', handleSave);
  }, [isEditing, title, content, linkedNotes, tags, note]);

  const handleSaveNote = async () => {
    if (!title.trim()) {
      alert('Please enter a note title');
      return;
    }

    if (isCreatingNewNote && !onCreate) {
      alert('onCreate handler not found');
      return;
    }

    if (isCreatingNewNote) {
      await onCreate(title, content, tags);
    } else if (note) {
      await onSave(note.id, title, content, linkedNotes, tags);
    }

    setIsEditing(false);
  };

  const handleCancel = () => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags || []);
      setLinkedNotes(note.linkedNotes || []);
    } else {
      setTitle('');
      setContent('');
      setTags([]);
      setLinkedNotes([]);
    }
    setIsEditing(false);
  };

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);

    // Check for [[ to trigger autocomplete
    const lastBracketIndex = newContent.lastIndexOf('[[');
    const lastCloseBracketIndex = newContent.lastIndexOf(']]');

    if (lastBracketIndex > lastCloseBracketIndex) {
      const searchText = newContent.substring(lastBracketIndex + 2).split(']]')[0];
      if (searchText.length > 0) {
        const matches = allNotes
          .filter(
            (n) =>
              n.title.toLowerCase().includes(searchText.toLowerCase()) &&
              n.id !== note?.id
          )
          .slice(0, 5);
        setAutocompleteMatches(matches);
        setAutocompleteIndex(0);
      } else {
        setAutocompleteMatches([]);
      }
    } else {
      setAutocompleteMatches([]);
    }
  };

  const insertLink = (noteName) => {
    const lastBracketIndex = content.lastIndexOf('[[');
    const before = content.substring(0, lastBracketIndex);
    const after = content.substring(content.indexOf(']]', lastBracketIndex) + 2);
    const newContent = `${before}[[${noteName}]]${after}`;
    setContent(newContent);
    setAutocompleteMatches([]);

    // Update linked notes
    const linkedNote = getNoteByTitle(noteName);
    if (linkedNote && !linkedNotes.includes(linkedNote.id)) {
      setLinkedNotes([...linkedNotes, linkedNote.id]);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleContentKeyDown = (e) => {
    if (autocompleteMatches.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setAutocompleteIndex(
          (autocompleteIndex + 1) % autocompleteMatches.length
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setAutocompleteIndex(
          (autocompleteIndex - 1 + autocompleteMatches.length) %
            autocompleteMatches.length
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        insertLink(autocompleteMatches[autocompleteIndex].title);
      } else if (e.key === 'Escape') {
        setAutocompleteMatches([]);
      }
    }
  };

  // View mode
  if (!isEditing && note) {
    const linkedNotesData = note.linkedNotes
      ? note.linkedNotes.map((id) => allNotes.find((n) => n.id === id)).filter(Boolean)
      : [];

    return (
      <div className="note-editor">
        {/* Icon Button Header */}
        <div className="note-editor-header">
          <div className="note-editor-actions">
            <button
              className="icon-button icon-button-edit"
              onClick={() => setIsEditing(true)}
              title="Edit note (Cmd+E)"
              aria-label="Edit note"
            >
              <Edit2 size={20} />
            </button>
            <button
              className="icon-button icon-button-duplicate"
              onClick={() => onDuplicate(note.id)}
              title="Duplicate note"
              aria-label="Duplicate note"
            >
              <Copy size={20} />
            </button>
            <button
              className="icon-button icon-button-delete"
              onClick={() => {
                if (
                  window.confirm(
                    'Are you sure you want to delete this note? This cannot be undone.'
                  )
                ) {
                  onDelete(note.id);
                }
              }}
              title="Delete note"
              aria-label="Delete note"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        {/* Note Content */}
        <div className="note-editor-content">
          <h1 className="note-title">{note.title}</h1>

          {note.tags && note.tags.length > 0 && (
            <div className="note-tags-view">
              {note.tags.map((tag) => (
                <span key={tag} className="note-tag-badge">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {lastSaved && (
            <p className="note-last-saved">
              Last saved {new Date(lastSaved).toLocaleTimeString()}
            </p>
          )}

          <div className="note-content-view">
            {note.content.split('\n').map((paragraph, idx) => (
              <p key={idx}>{paragraph || <br />}</p>
            ))}
          </div>

          {linkedNotesData.length > 0 && (
            <div className="note-linked-section">
              <h3>Linked Notes</h3>
              <div className="note-linked-list">
                {linkedNotesData.map((linkedNote) => (
                  <button
                    key={linkedNote.id}
                    className="note-link-item"
                    onClick={() => onSelectNote(linkedNote)}
                  >
                    {linkedNote.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {backlinks.length > 0 && (
            <div className="note-backlinks-section">
              <h3>Backlinks</h3>
              <div className="note-backlinks-list">
                {backlinks.map((backlink) => (
                  <button
                    key={backlink.id}
                    className="note-backlink-item"
                    onClick={() => onSelectNote(backlink)}
                  >
                    {backlink.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Edit/Create mode
  if (isEditing || isCreatingNewNote) {
    return (
      <div className="note-editor">
        {/* Save/Cancel Header */}
        <div className="note-editor-header">
          <div className="note-editor-actions">
            <button
              className="icon-button icon-button-save"
              onClick={handleSaveNote}
              title="Save note (Cmd+S)"
              aria-label="Save note"
            >
              <Save size={20} />
            </button>
            <button
              className="icon-button icon-button-cancel"
              onClick={handleCancel}
              title="Cancel editing (Esc)"
              aria-label="Cancel editing"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Edit Form */}
        <div className="note-editor-form">
          <input
            type="text"
            className="note-title-input"
            placeholder="Note title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />

          <div className="note-tags-section">
            <div className="note-tags-input-group">
              <input
                type="text"
                className="note-tag-input"
                placeholder="Add tags..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                list="tag-suggestions"
              />
              <datalist id="tag-suggestions">
                {allTags
                  .filter(
                    (tag) =>
                      !tags.includes(tag) &&
                      tag.toLowerCase().includes(tagInput.toLowerCase())
                  )
                  .map((tag) => (
                    <option key={tag} value={tag} />
                  ))}
              </datalist>
              <button
                type="button"
                className="note-tag-add-btn"
                onClick={handleAddTag}
              >
                Add
              </button>
            </div>

            {tags.length > 0 && (
              <div className="note-tags-list">
                {tags.map((tag) => (
                  <span key={tag} className="note-tag-item">
                    {tag}
                    <button
                      type="button"
                      className="note-tag-remove-btn"
                      onClick={() => handleRemoveTag(tag)}
                      aria-label={`Remove tag ${tag}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="note-content-input-wrapper">
            <textarea
              ref={contentRef}
              className="note-content-input"
              placeholder="Start typing... Use [[note-name]] to link to other notes"
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleContentKeyDown}
            />

            {autocompleteMatches.length > 0 && (
              <div className="autocomplete-dropdown" ref={autocompleteRef}>
                {autocompleteMatches.map((match, idx) => (
                  <button
                    key={match.id}
                    className={`autocomplete-item ${
                      idx === autocompleteIndex ? 'selected' : ''
                    }`}
                    onClick={() => insertLink(match.title)}
                  >
                    {match.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  return (
    <div className="note-editor">
      <div className="note-editor-empty">
        <div className="note-editor-empty-actions">
          <button 
            className="empty-action-btn empty-action-select"
            onClick={() => {
              // Trigger hamburger menu on mobile to show sidebar
              const hamburger = document.querySelector('.hamburger-menu-btn');
              if (hamburger) {
                hamburger.click();
              }
            }}
            title="Open the note list"
          >
            <BookOpen size={20} />
            <span>Select a note</span>
          </button>
          <button 
            className="empty-action-btn empty-action-create"
            onClick={onCreateNew}
            title="Create a new note (Cmd+N)"
          >
            <Plus size={20} />
            <span>Create a new one</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default NoteEditor;
