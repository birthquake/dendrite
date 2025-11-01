import { useState, useEffect, useCallback } from 'react';
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc,
  updateDoc,
  query,
  where
} from 'firebase/firestore';
import './styles/theme-variables.css';
import './App.css';
import { ToastProvider, useToast } from './components/toast/toast-provider';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { CommandPalette } from './components/CommandPalette';
import ThemeToggle from './components/ThemeToggle';
import HamburgerMenu from './components/HamburgerMenu';
import NoteEditor from './components/NoteEditor';
import NoteList from './components/NoteList';
import Graph from './components/Graph';
import { useAuth } from './hooks/useAuth';
import { PrivateRoute } from './components/PrivateRoute';

function AppContent() {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isCreatingNewNote, setIsCreatingNewNote] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [sortBy, setSortBy] = useState(() => {
    return localStorage.getItem('dendrite-sort-preference') || 'date-created';
  });
  const toast = useToast();
  const { user, logout } = useAuth();

  useEffect(() => {
    const initApp = async () => {
      try {
        await loadNotes();
        setLoading(false);
      } catch (error) {
        toast.error('Failed to initialize app. Please refresh.');
        setLoading(false);
      }
    };
    initApp();
  }, [user, toast]);

  const loadNotes = async () => {
    try {
      // Load notes from user-scoped collection
      const notesRef = collection(db, `users/${user.uid}/notes`);
      const querySnapshot = await getDocs(notesRef);
      const notesArray = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotes(notesArray);
    } catch (error) {
      toast.error('Failed to load notes');
    }
  };

  const getSortedNotes = (notesToSort) => {
    const sorted = [...notesToSort];

    switch (sortBy) {
      case 'title-asc':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'most-tags':
        sorted.sort((a, b) => {
          const aTagCount = a.tags ? a.tags.length : 0;
          const bTagCount = b.tags ? b.tags.length : 0;
          return bTagCount - aTagCount;
        });
        break;
      case 'date-created':
      default:
        sorted.sort((a, b) => {
          const aDate = a.updatedAt?.toDate?.() || a.updatedAt || a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
          const bDate = b.updatedAt?.toDate?.() || b.updatedAt || b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
          return bDate - aDate;
        });
    }

    return sorted;
  };

  const handleSortChange = (newSortOption) => {
    setSortBy(newSortOption);
    localStorage.setItem('dendrite-sort-preference', newSortOption);
  };

  const getNoteByTitle = (title) => {
    return notes.find(note => note.title.toLowerCase() === title.toLowerCase());
  };

  const getBacklinks = (noteId) => {
    const targetNote = notes.find(n => n.id === noteId);
    if (!targetNote) {
      return [];
    }
    
    const backlinks = notes.filter(note => 
      note.linkedNotes && note.linkedNotes.includes(noteId)
    );
    
    return backlinks;
  };

  const createNoteIfNotExists = async (title) => {
    const existingNote = getNoteByTitle(title);
    
    if (existingNote) {
      return existingNote.id;
    }
    
    try {
      const docRef = await addDoc(collection(db, `users/${user.uid}/notes`), {
        title: title,
        content: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        linkedNotes: [],
        tags: []
      });
      await loadNotes();
      return docRef.id;
    } catch (error) {
      toast.error('Failed to create note');
      return null;
    }
  };

  const extractLinkedNoteIds = (content) => {
    const linkRegex = /\[\[([^\]]+)\]\]/g;
    const linkedNoteIds = [];
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const linkTitle = match[1];
      const linkedNote = getNoteByTitle(linkTitle);
      if (linkedNote && !linkedNoteIds.includes(linkedNote.id)) {
        linkedNoteIds.push(linkedNote.id);
      }
    }

    return linkedNoteIds;
  };

  const getAllTags = () => {
    const tagsSet = new Set();
    notes.forEach(note => {
      if (note.tags && Array.isArray(note.tags)) {
        note.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  };

  const createNote = async (title, content, tags = []) => {
    try {
      const linkedNotes = extractLinkedNoteIds(content);

      await addDoc(collection(db, `users/${user.uid}/notes`), {
        title: title,
        content: content,
        createdAt: new Date(),
        updatedAt: new Date(),
        linkedNotes: linkedNotes,
        tags: tags
      });
      await loadNotes();
      setIsCreatingNewNote(false);
      toast.success('Note created successfully!');
    } catch (error) {
      toast.error('Failed to create note');
    }
  };

  const updateNote = async (noteId, title, content, linkedNotes = [], tags = []) => {
    try {
      const extractedLinkedNotes = extractLinkedNoteIds(content);

      await updateDoc(doc(db, `users/${user.uid}/notes`, noteId), {
        title: title,
        content: content,
        linkedNotes: extractedLinkedNotes,
        tags: tags,
        updatedAt: new Date()
      });
      
      await loadNotes();
      setSelectedNote(null);
      toast.success('Note saved successfully!');
    } catch (error) {
      toast.error('Failed to save note');
    }
  };

  const deleteNote = async (noteId) => {
    try {
      await deleteDoc(doc(db, `users/${user.uid}/notes`, noteId));
      loadNotes();
      setSelectedNote(null);
      toast.success('Note deleted');
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const duplicateNote = async (noteId) => {
    try {
      const noteToDuplicate = notes.find(n => n.id === noteId);
      if (!noteToDuplicate) {
        toast.error('Note not found');
        return;
      }

      const newTitle = `${noteToDuplicate.title} (copy)`;
      
      const docRef = await addDoc(collection(db, `users/${user.uid}/notes`), {
        title: newTitle,
        content: noteToDuplicate.content,
        createdAt: new Date(),
        updatedAt: new Date(),
        linkedNotes: noteToDuplicate.linkedNotes || [],
        tags: noteToDuplicate.tags || []
      });

      await loadNotes();
      
      const newNote = {
        id: docRef.id,
        title: newTitle,
        content: noteToDuplicate.content,
        linkedNotes: noteToDuplicate.linkedNotes || [],
        tags: noteToDuplicate.tags || []
      };
      
      setSelectedNote(newNote);
      toast.success('Note duplicated!');
    } catch (error) {
      toast.error('Failed to duplicate note');
    }
  };

  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setShowCommandPalette(true);
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      setShowShortcutsModal(true);
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('save-note'));
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      setSelectedNote(null);
      setIsCreatingNewNote(true);
    }

    if (e.key === 'Escape') {
      setIsCreatingNewNote(false);
      window.dispatchEvent(new CustomEvent('cancel-edit'));
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleSelectNote = (note) => {
    setSelectedNote(note);
    setIsMobileSidebarOpen(false);
  };

  const handleCreateNewNote = () => {
    setSelectedNote(null);
    setIsCreatingNewNote(true);
    setIsMobileSidebarOpen(false);
  };

  const handleCancelEdit = () => {
    setIsCreatingNewNote(false);
    setSelectedNote(null);
    setIsMobileSidebarOpen(false);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading Dendrite...</p>
      </div>
    );
  }

  const sortedNotes = getSortedNotes(notes);

  return (
    <div className="App">
      <KeyboardShortcutsModal 
        isOpen={showShortcutsModal} 
        onClose={() => setShowShortcutsModal(false)} 
      />
      <CommandPalette 
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        notes={notes}
        onSelectNote={(note) => {
          setSelectedNote(note);
          setView('list');
        }}
      />
      <header className="header">
        <h1>🧠 Dendrite</h1>
        <div className="header-controls">
          {view === 'list' && (
            <HamburgerMenu 
              isOpen={isMobileSidebarOpen}
              onToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            />
          )}
          <ThemeToggle />
          
          <div className="user-profile">
            <span className="user-email">{user.email}</span>
            <button 
              className="logout-btn"
              onClick={logout}
              title="Logout"
            >
              Logout
            </button>
          </div>

          <div className="view-toggle">
            <button 
              className={view === 'list' ? 'active' : ''} 
              onClick={() => setView('list')}
              title="List view"
            >
              List
            </button>
            <button 
              className={view === 'graph' ? 'active' : ''} 
              onClick={() => setView('graph')}
              title="Graph view"
            >
              Graph
            </button>
          </div>
        </div>
      </header>

      {isMobileSidebarOpen && view === 'list' && (
        <div 
          className="mobile-sidebar-overlay"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <div className={`main-container ${isMobileSidebarOpen ? 'sidebar-open' : ''}`}>
        {view === 'list' ? (
          <>
            <div className="sidebar">
              <NoteList 
                notes={sortedNotes} 
                selectedNote={selectedNote}
                onSelectNote={handleSelectNote}
                onCreateNewNote={handleCreateNewNote}
                allTags={getAllTags()}
                sortBy={sortBy}
                onSortChange={handleSortChange}
              />
            </div>
            <div className="editor">
              {selectedNote ? (
                <NoteEditor 
                  note={selectedNote}
                  allNotes={notes}
                  onSave={updateNote}
                  onDelete={deleteNote}
                  onDuplicate={duplicateNote}
                  onSelectNote={setSelectedNote}
                  getNoteByTitle={getNoteByTitle}
                  getBacklinks={getBacklinks}
                  createNoteIfNotExists={createNoteIfNotExists}
                  allTags={getAllTags()}
                  onCreateNew={handleCreateNewNote}
                  onCancel={handleCancelEdit}
                />
              ) : (
                <NoteEditor 
                  note={null}
                  allNotes={notes}
                  onCreate={createNote}
                  onDelete={deleteNote}
                  onSelectNote={setSelectedNote}
                  isCreatingNewNote={isCreatingNewNote}
                  getNoteByTitle={getNoteByTitle}
                  getBacklinks={getBacklinks}
                  createNoteIfNotExists={createNoteIfNotExists}
                  allTags={getAllTags()}
                  onCreateNew={handleCreateNewNote}
                  onCancel={handleCancelEdit}
                />
              )}
            </div>
          </>
        ) : (
          <Graph 
            notes={notes} 
            onSelectNote={(note) => {
              setSelectedNote(note);
              setView('list');
            }} 
          />
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <PrivateRoute>
        <AppContent />
      </PrivateRoute>
    </ToastProvider>
  );
}

export default App;
