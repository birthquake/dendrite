import { useState, useEffect } from 'react';
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
import './App.css';
import NoteEditor from './components/NoteEditor';
import NoteList from './components/NoteList';
import Graph from './components/Graph';

function App() {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' or 'graph'

  // Initialize app and load notes
  useEffect(() => {
    const initApp = async () => {
      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
        loadNotes();
        setLoading(false);
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };
    initApp();
  }, []);

  // Load all notes from Firestore
  const loadNotes = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'notes'));
      const notesArray = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotes(notesArray);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  // ===== HELPER FUNCTIONS FOR LINKING =====

  // Find a note by exact title match
  const getNoteByTitle = (title) => {
    return notes.find(note => note.title.toLowerCase() === title.toLowerCase());
  };

  // Get all backlinks (notes that link TO this note)
  const getBacklinks = (noteId) => {
    const targetNote = notes.find(n => n.id === noteId);
    if (!targetNote) return [];
    
    return notes.filter(note => 
      note.linkedNotes && note.linkedNotes.includes(noteId)
    );
  };

  // Create a note if it doesn't exist, return its ID
  const createNoteIfNotExists = async (title) => {
    const existingNote = getNoteByTitle(title);
    
    if (existingNote) {
      return existingNote.id;
    }
    
    // Note doesn't exist, create it
    try {
      const docRef = await addDoc(collection(db, 'notes'), {
        title: title,
        content: '', // Empty content for auto-created notes
        createdAt: new Date(),
        linkedNotes: []
      });
      await loadNotes(); // Reload to get the new note
      return docRef.id;
    } catch (error) {
      console.error('Error creating note:', error);
      return null;
    }
  };

  // ===== END HELPER FUNCTIONS =====

  // Create a new note
  const createNote = async (title, content) => {
    try {
      await addDoc(collection(db, 'notes'), {
        title: title,
        content: content,
        createdAt: new Date(),
        linkedNotes: []
      });
      loadNotes();
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  // Update a note
  const updateNote = async (noteId, title, content, linkedNotes = []) => {
    try {
      await updateDoc(doc(db, 'notes', noteId), {
        title: title,
        content: content,
        linkedNotes: linkedNotes
      });
      loadNotes();
      setSelectedNote(null);
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  // Delete a note
  const deleteNote = async (noteId) => {
    try {
      await deleteDoc(doc(db, 'notes', noteId));
      loadNotes();
      setSelectedNote(null);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading Dendrite...</div>;
  }

  return (
    <div className="App">
      <header className="header">
        <h1>🧠 Dendrite</h1>
        <div className="view-toggle">
          <button 
            className={view === 'list' ? 'active' : ''} 
            onClick={() => setView('list')}
          >
            List
          </button>
          <button 
            className={view === 'graph' ? 'active' : ''} 
            onClick={() => setView('graph')}
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
                />
              ) : (
                <NoteEditor 
                  note={null}
                  allNotes={notes}
                  onCreate={createNote}
                  onDelete={deleteNote}
                  onSelectNote={setSelectedNote}
                  getNoteByTitle={getNoteByTitle}
                  getBacklinks={getBacklinks}
                  createNoteIfNotExists={createNoteIfNotExists}
                />
              )}
            </div>
          </>
        ) : (
          <Graph notes={notes} />
        )}
      </div>
    </div>
  );
}

export default App;
