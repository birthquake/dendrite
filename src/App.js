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
  const [isCreatingNewNote, setIsCreatingNewNote] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');

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

  const loadNotes = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'notes'));
      const notesArray = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Loaded notes from Firestore:', notesArray);
      setNotes(notesArray);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const getNoteByTitle = (title) => {
    return notes.find(note => note.title.toLowerCase() === title.toLowerCase());
  };

  const getBacklinks = (noteId) => {
    const targetNote = notes.find(n => n.id === noteId);
    if (!targetNote) {
      console.log('Target note not found for id:', noteId);
      return [];
    }
    
    console.log('Looking for backlinks to:', targetNote.title);
    console.log('All notes:', notes.map(n => ({ id: n.id, title: n.title, linkedNotes: n.linkedNotes })));
    
    const backlinks = notes.filter(note => 
      note.linkedNotes && note.linkedNotes.includes(noteId)
    );
    
    console.log('Found backlinks:', backlinks.map(n => n.title));
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
      console.error('Error creating note:', error);
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
      console.log('Found link to:', linkTitle, '- Note exists?', !!linkedNote, 'ID:', linkedNote?.id);
      if (linkedNote && !linkedNoteIds.includes(linkedNote.id)) {
        linkedNoteIds.push(linkedNote.id);
      }
    }

    console.log('Total linkedNoteIds extracted:', linkedNoteIds);
    return linkedNoteIds;
  };

  // Get all unique tags from all notes
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
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const updateNote = async (noteId, title, content, linkedNotes = [], tags = []) => {
    try {
      console.log('=== UPDATING NOTE ===');
      console.log('Note ID:', noteId);
      console.log('Title:', title);
      console.log('Content:', content);
      console.log('Tags:', tags);
      
      const extractedLinkedNotes = extractLinkedNoteIds(content);
      console.log('Extracted linked notes:', extractedLinkedNotes);

      await updateDoc(doc(db, 'notes', noteId), {
        title: title,
        content: content,
        linkedNotes: extractedLinkedNotes,
        tags: tags
      });
      
      console.log('Note saved to Firestore. Reloading...');
      await loadNotes();
      
      setSelectedNote(null);
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

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

export default App;
