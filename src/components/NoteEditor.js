import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import './NoteEditor.css';
import DeleteConfirmModal from './DeleteConfirmModal';

function NoteEditor({ 
  note, 
  allNotes = [], 
  onCreate, 
  onSave, 
  onDelete,
  onSelectNote,
  isCreatingNewNote = false,
  getNoteByTitle,
  getBacklinks,
  createNoteIfNotExists,
  allTags = []
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(!note);
  const [linkedNotes, setLinkedNotes] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Autocomplete state
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cursorPos, setCursorPos] = useState(0);
  const textareaRef = useRef(null);

  // Hover preview state
  const [hoveredLinkTitle, setHoveredLinkTitle] = useState(null);
  const [hoverPreviewPos, setHoverPreviewPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setLinkedNotes(note.linkedNotes || []);
      setTags(note.tags || []);
      setIsEditing(false);
    } else if (isCreatingNewNote) {
      setTitle('');
      setContent('');
      setLinkedNotes([]);
      setTags([]);
      setIsEditing(true);
    } else {
      setTitle('');
      setContent('');
      setLinkedNotes([]);
      setTags([]);
      setIsEditing(true);
    }
    
    setHoveredLinkTitle(null);
    setTagInput('');
    setShowTagSuggestions(false);
  }, [note, isCreatingNewNote]);

  // Listen for keyboard shortcuts (Esc to cancel, and custom save event)
  useEffect(() => {
    const handleCancelShortcut = (e) => {
      if (e.key === 'Escape' && isEditing) {
        if (note) {
          setIsEditing(false);
        }
      }
    };

    const handleCustomSave = () => {
      if (isEditing) {
        handleSave();
      }
    };

    window.addEventListener('keydown', handleCancelShortcut);
    window.addEventListener('save-note', handleCustomSave);

    return () => {
      window.removeEventListener('keydown', handleCancelShortcut);
      window.removeEventListener('save-note', handleCustomSave);
    };
  }, [isEditing, note, title, content, tags]);

  // ===== TAG LOGIC =====

  const handleTagInput = (e) => {
    const value = e.target.value;
    setTagInput(value);

    if (value.trim()) {
      const filtered = allTags.filter(tag =>
        tag.toLowerCase().includes(value.toLowerCase()) && !tags.includes(tag)
      );
      setTagSuggestions(filtered);
      setShowTagSuggestions(true);
    } else {
      setShowTagSuggestions(false);
    }
  };

  const addTag = (tagName) => {
    const trimmedTag = tagName.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
    }
    setTagInput('');
    setShowTagSuggestions(false);
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  // ===== END TAG LOGIC =====

  // ===== AUTOCOMPLETE LOGIC =====

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    setCursorPos(e.target.selectionStart);

    const textBeforeCursor = newContent.substring(0, e.target.selectionStart);
    const lastBracketIndex = textBeforeCursor.lastIndexOf('[[');
    
    if (lastBracketIndex !== -1) {
      const textAfterLastBracket = textBeforeCursor.substring(lastBracketIndex + 2);
      
      if (!textAfterLastBracket.includes(']]')) {
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

  const insertLink = async (noteTitleToLink) => {
    if (!textareaRef.current) return;

    const textBeforeCursor = content.substring(0, cursorPos);
    const lastBracketIndex = textBeforeCursor.lastIndexOf('[[');

    if (lastBracketIndex === -1) return;

    let linkNoteId = null;
    const existingNote = getNoteByTitle(noteTitleToLink);
    
    if (existingNote) {
      linkNoteId = existingNote.id;
    } else {
      linkNoteId = await createNoteIfNotExists(noteTitleToLink);
    }

    const beforeLink = content.substring(0, lastBracketIndex);
    const afterLink = content.substring(cursorPos);
    const newContent = beforeLink + '[[' + noteTitleToLink + ']]' + afterLink;

    setContent(newContent);

    if (linkNoteId && !linkedNotes.includes(linkNoteId)) {
      setLinkedNotes([...linkedNotes, linkNoteId]);
    }

    setShowAutocomplete(false);
    setSearchTerm('');

    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = beforeLink.length + 2 + noteTitleToLink.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // ===== END AUTOCOMPLETE LOGIC =====

  // ===== LINK PARSING AND RENDERING =====

  const renderContentWithLinks = () => {
    const linkRegex = /\[\[([^\]]+)\]\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.index)
        });
      }

      const linkTitle = match[1];
      const linkedNote = getNoteByTitle(linkTitle);

      parts.push({
        type: 'link',
        title: linkTitle,
        noteExists: !!linkedNote,
        noteId: linkedNote?.id,
        notePreview: linkedNote?.content || ''
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex)
      });
    }

    return parts.map((part, idx) => {
      if (part.type === 'text') {
        return <span key={idx}>{part.content}</span>;
      } else if (part.type === 'link') {
        return (
          <span
            key={idx}
            className={`note-link ${!part.noteExists ? 'broken-link' : ''}`}
            onClick={() => {
              if (part.noteExists && onSelectNote) {
                const noteToSelect = allNotes.find(n => n.id === part.noteId);
                onSelectNote(noteToSelect);
              }
            }}
            onMouseEnter={(e) => {
              setHoveredLinkTitle(part.title);
              setHoverPreviewPos({
                x: e.clientX,
                y: e.clientY
              });
            }}
            onMouseLeave={() => setHoveredLinkTitle(null)}
          >
            {part.title}
          </span>
        );
      }
    });
  };

  // ===== END LINK PARSING =====

  // ===== BACKLINKS SECTION =====

  const renderBacklinks = () => {
    if (!note) return null;

    const backlinks = getBacklinks(note.id);

    if (backlinks.length === 0) {
      return null;
    }

    return (
      <div className="backlinks-section">
        <h3>Linked from {backlinks.length} note{backlinks.length !== 1 ? 's' : ''}</h3>
        <div className="backlinks-container">
          {backlinks.map(backlink => (
            <div
              key={backlink.id}
              className="backlink-item"
              onClick={() => onSelectNote(backlink)}
            >
              <div className="backlink-title">{backlink.title}</div>
              <div className="backlink-preview">
                {backlink.content?.substring(0, 60)}...
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ===== END BACKLINKS SECTION =====

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Note title cannot be empty');
      return;
    }

    if (!content.trim()) {
      toast.error('Note content cannot be empty');
      return;
    }

    setIsSaving(true);

    try {
      if (note) {
        await onSave(note.id, title, content, linkedNotes, tags);
      } else {
        await onCreate(title, content, tags);
        setTitle('');
        setContent('');
        setLinkedNotes([]);
        setTags([]);
      }
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setShowDeleteModal(false);
    setIsSaving(true);

    try {
      await onDelete(note.id);
    } catch (error) {
      toast.error('Failed to delete note');
    } finally {
      setIsSaving(false);
    }
  };

  if (!note && !isEditing && !isCreatingNewNote) {
    return <div className="editor-empty">Select a note or create a new one</div>;
  }

  return (
    <div className="note-editor">
      {showDeleteModal && (
        <DeleteConfirmModal
          noteTitle={title}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      {isEditing ? (
        <>
          <input
            type="text"
            className="editor-title"
            placeholder="Note title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            disabled={isSaving}
          />

          {/* TAG INPUT */}
          <div className="tag-input-container">
            <div className="tags-display">
              {tags.map(tag => (
                <div key={tag} className="tag-chip">
                  {tag}
                  <button
                    className="tag-remove"
                    onClick={() => removeTag(tag)}
                    disabled={isSaving}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="tag-input-wrapper">
              <input
                type="text"
                className="tag-input"
                placeholder="Add tags..."
                value={tagInput}
                onChange={handleTagInput}
                onKeyDown={handleTagKeyDown}
                disabled={isSaving}
              />
              {showTagSuggestions && tagSuggestions.length > 0 && (
                <div className="tag-suggestions">
                  {tagSuggestions.map(tag => (
                    <div
                      key={tag}
                      className="tag-suggestion-item"
                      onClick={() => addTag(tag)}
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="editor-textarea-wrapper">
            <textarea
              ref={textareaRef}
              className="editor-content"
              placeholder="Start writing... Type [[ to link notes"
              value={content}
              onChange={handleContentChange}
              disabled={isSaving}
            />
            
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
            <button 
              className="save-btn" 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save (Ctrl+S)'}
            </button>
            {note && (
              <button 
                className="cancel-btn" 
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Cancel (Esc)
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="note-header">
            <h1>{title}</h1>
            <div className="note-actions">
              <button 
                className="edit-btn" 
                onClick={() => setIsEditing(true)}
                disabled={isSaving}
              >
                Edit
              </button>
              <button 
                className="delete-btn" 
                onClick={handleDeleteClick}
                disabled={isSaving}
              >
                Delete
              </button>
            </div>
          </div>

          {/* TAG DISPLAY IN VIEW MODE */}
          {tags.length > 0 && (
            <div className="note-tags-display">
              {tags.map(tag => (
                <span key={tag} className="note-tag">{tag}</span>
              ))}
            </div>
          )}

          <div className="note-content">
            {renderContentWithLinks()}
          </div>

          {renderBacklinks()}

          {hoveredLinkTitle && (
            <div 
              className="link-preview-tooltip"
              style={{
                left: `${hoverPreviewPos.x}px`,
                top: `${hoverPreviewPos.y + 20}px`
              }}
            >
              <div className="tooltip-title">{hoveredLinkTitle}</div>
              <div className="tooltip-preview">
                {getNoteByTitle(hoveredLinkTitle)?.content?.substring(0, 100)}...
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default NoteEditor;
