import { useState, useEffect, useCallback } from 'react';
import { db, auth } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc,
  updateDoc
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { ToastProvider, useToast } from './components/toast/toast-provider';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import './App.css';
import NoteEditor from './components/NoteEditor';
import NoteList from './components/NoteList';
import Graph from './components/Graph';

function AppContent() {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isCreatingNewNote, setIsCreatingNewNote] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const initApp = async () => {
      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
        loadNotes();
        setLoading(false);
      } catch (error) {
        toast.error('Failed to initialize app. Please refresh.');
        setLoading(false);
      }
    };
    initApp();
  }, [toast]);

  const loadNotes = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'notes'));
      const notesArray = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotes(notesArray);
    } catch (error) {
      toast.error('Failed to load notes');
    }
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
      const docRef = await addDoc(collection(db, 'notes'), {
        title: title,
        content: '',
        createdAt: new Date(),
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

      await addDoc(collection(db, 'notes'), {
        title: title,
        content: content,
        createdAt: new Date(),
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

      await updateDoc(doc(db, 'notes', noteId), {
        title: title,
        content: content,
        linkedNotes: extractedLinkedNotes,
        tags: tags
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
      await deleteDoc(doc(db, 'notes', noteId));
      loadNotes();
      setSelectedNote(null);
      toast.success('Note deleted');
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const handleKeyDown = useCallback((e) => {
    // Cmd+? or Ctrl+? to show shortcuts
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '?') {
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

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading Dendrite...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <KeyboardShortcutsModal 
        isOpen={showShortcutsModal} 
        onClose={() => setShowShortcutsModal(false)} 
      />
      <header className="header">
        <h1>🧠 Dendrite</h1>
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
      </header>
      <div className="main-container">
        {view === 'list' ? (
          <>
            <div className="sidebar">
              <NoteList 
                notes={notes} 
                selectedNote={selectedNote}
                onSelectNote={setSelectedNote}
                onCreateNewNote={() => {
                  setSelectedNote(null);
                  setIsCreatingNewNote(true);
                }}
                allTags={getAllTags()}
              />
            </div>
            <div className="editor">
              {selectedNote ? (
                <NoteEditor 
                  note={selectedNote}
                  allNotes={notes}
                  onSave={updateNote}
                  onDelete={deleteNote}
                  onSelectNote={setSelectedNote}
                  getNoteByTitle={getNoteByTitle}
                  getBacklinks={getBacklinks}
                  createNoteIfNotExists={createNoteIfNotExists}
                  allTags={getAllTags()}
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
      <AppContent />
    </ToastProvider>
  );
}

export default App;
