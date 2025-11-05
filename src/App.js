import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc,
  updateDoc,
  query,
  where,
  setDoc,
  getDoc,
  arrayUnion,
  onSnapshot,
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
  const [sharedNotes, setSharedNotes] = useState([]);
  const [noteShares, setNoteShares] = useState({});
  const [selectedNote, setSelectedNote] = useState(null);
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced', 'syncing', 'error'
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
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        await loadNotes();
        await loadSharedNotes();
        setLoading(false);
      } catch (error) {
        toast.error('Failed to initialize app. Please refresh.');
        setLoading(false);
      }
    };
    initApp();
  }, [user, toast]);

  // Set up real-time listener for selected note
  useEffect(() => {
    if (!selectedNote || !selectedNote.id) {
      console.log('No selectedNote or selectedNote.id, cleaning up listener');
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      return;
    }

    const setupListener = async () => {
      try {
        const isOwner = notes.some(n => n.id === selectedNote.id);
        console.log('Setting up listener for note:', selectedNote.id, 'isOwner:', isOwner);

        let noteRef;

        if (isOwner) {
          noteRef = doc(db, `users/${user.uid}/notes/${selectedNote.id}`);
          console.log('Owner note ref path:', `users/${user.uid}/notes/${selectedNote.id}`);
        } else {
          // For shared notes, find the owner from sharedNotes
          const sharedNote = sharedNotes.find(n => n.id === selectedNote.id);
          if (!sharedNote) {
            console.error('Shared note not found in sharedNotes. sharedNotes:', sharedNotes);
            return;
          }
          noteRef = doc(db, `users/${sharedNote.ownerId}/notes/${selectedNote.id}`);
          console.log('Shared note ref path:', `users/${sharedNote.ownerId}/notes/${selectedNote.id}`);
        }

        setSyncStatus('syncing');
        
        unsubscribeRef.current = onSnapshot(
          noteRef,
          (snapshot) => {
            if (snapshot.exists()) {
              console.log('Real-time update received! Data:', snapshot.data());
             const updatedData = {
  ...snapshot.data(),
  id: snapshot.id
};
setSelectedNote(prev => ({
  ...prev,
  ...updatedData
}));

// Also update in sharedNotes if it's a shared note
setSharedNotes(prev => prev.map(n => 
  n.id === snapshot.id ? { ...n, ...updatedData } : n
));
              setSyncStatus('synced');
            } else {
              console.warn('Snapshot does not exist');
            }
          },
          (error) => {
            console.error('Real-time sync error:', error);
            setSyncStatus('error');
            toast.error('Real-time sync error: ' + error.message);
          }
        );
        
        console.log('Listener set up successfully');
      } catch (error) {
        console.error('Failed to set up listener:', error);
        setSyncStatus('error');
      }
    };

    setupListener();

    return () => {
      if (unsubscribeRef.current) {
        console.log('Cleaning up listener');
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [selectedNote?.id, user.uid, notes, sharedNotes]);

  const loadNotes = async () => {
    try {
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

  const loadSharedNotes = async () => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists() || !userSnap.data().sharedWithMe) {
        setSharedNotes([]);
        return;
      }
      
      const sharedWithMeList = userSnap.data().sharedWithMe || [];
      const shared = [];
      
      for (const share of sharedWithMeList) {
        try {
          const noteRef = doc(db, `users/${share.ownerId}/notes/${share.noteId}`);
          const noteSnap = await getDoc(noteRef);
          
          if (noteSnap.exists()) {
            shared.push({
              id: share.noteId,
              ownerId: share.ownerId,
              ...noteSnap.data(),
              permission: share.permission,
            });
          }
        } catch (err) {
          console.error('Error loading shared note:', err);
        }
      }
      
      setSharedNotes(shared);
    } catch (error) {
      console.error('Failed to load shared notes:', error);
    }
  };

  const shareNote = async (noteId, email, permission) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnap = await getDocs(q);
      
      if (querySnap.empty) {
        toast.error('User not found');
        return;
      }
      
      const sharedWithUid = querySnap.docs[0].id;
      
      // Create or update share document
      const shareRef = doc(db, `users/${user.uid}/notes/${noteId}/shares/${sharedWithUid}`);
      await setDoc(shareRef, {
        email: email,
        permission: permission,
        sharedAt: new Date(),
        sharedByEmail: user.email,
      });
      
      // Check if already in sharedWithMe array
      const recipientUserRef = doc(db, 'users', sharedWithUid);
      const recipientSnap = await getDoc(recipientUserRef);
      const existingShare = recipientSnap.data()?.sharedWithMe?.find(s => s.noteId === noteId);
      
      if (existingShare) {
        // Update existing share (permission change)
        const updatedSharedWithMe = recipientSnap.data().sharedWithMe.map(s =>
          s.noteId === noteId ? { ...s, permission } : s
        );
        await updateDoc(recipientUserRef, {
          sharedWithMe: updatedSharedWithMe
        });
        toast.success(`Permissions updated for ${email}`);
      } else {
        // Add new share
        await updateDoc(recipientUserRef, {
          sharedWithMe: arrayUnion({
            noteId: noteId,
            ownerId: user.uid,
            permission: permission,
          })
        });
        toast.success(`Note shared with ${email}`);
      }
      
      await getNotesShares(noteId);
    } catch (error) {
      toast.error('Failed to share note');
      console.error('Share error:', error);
    }
  };

  const unshareNote = async (noteId, sharedWithUid) => {
    try {
      // Delete the share document
      const shareRef = doc(db, `users/${user.uid}/notes/${noteId}/shares/${sharedWithUid}`);
      await deleteDoc(shareRef);
      
      // Remove from recipient's sharedWithMe array
      const recipientUserRef = doc(db, 'users', sharedWithUid);
      const recipientSnap = await getDoc(recipientUserRef);
      
      if (recipientSnap.exists()) {
        const updatedSharedWithMe = recipientSnap.data().sharedWithMe?.filter(s => s.noteId !== noteId) || [];
        await updateDoc(recipientUserRef, {
          sharedWithMe: updatedSharedWithMe
        });
      }
      
      await getNotesShares(noteId);
      toast.success('Access revoked');
    } catch (error) {
      toast.error('Failed to revoke access');
      console.error('Unshare error:', error);
    }
  };

  const getNotesShares = async (noteId) => {
    try {
      const sharesRef = collection(db, `users/${user.uid}/notes/${noteId}/shares`);
      const sharesSnap = await getDocs(sharesRef);
      
      const shares = sharesSnap.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));
      
      setNoteShares(prev => ({
        ...prev,
        [noteId]: shares
      }));
    } catch (error) {
      console.error('Failed to load shares:', error);
    }
  };

  const isNoteOwner = (noteId) => {
    return notes.some(n => n.id === noteId);
  };

  const getUserPermission = (noteId) => {
    const ownedNote = notes.find(n => n.id === noteId);
    if (ownedNote) return 'admin';
    
    const sharedNote = sharedNotes.find(n => n.id === noteId);
    return sharedNote?.permission || null;
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
    const allNotesArray = [...notes, ...sharedNotes];
    return allNotesArray.find(note => note.title.toLowerCase() === title.toLowerCase());
  };

  const getBacklinks = (noteId) => {
    const allNotesArray = [...notes, ...sharedNotes];
    const targetNote = allNotesArray.find(n => n.id === noteId);
    if (!targetNote) {
      return [];
    }
    
    const backlinks = allNotesArray.filter(note => 
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
    const allNotesArray = [...notes, ...sharedNotes];
    const tagsSet = new Set();
    allNotesArray.forEach(note => {
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

  const updateNote = async (noteId, title, content, linkedNotes = [], tags = [], silent = false) => {
    try {
      const permission = getUserPermission(noteId);
      
      if (permission === 'view') {
        if (!silent) {
          toast.error('You do not have permission to edit this note');
        }
        return;
      }

      const extractedLinkedNotes = extractLinkedNoteIds(content);
      const isOwner = isNoteOwner(noteId);
      const targetPath = isOwner 
        ? `users/${user.uid}/notes/${noteId}`
        : (() => {
            const sharedNote = sharedNotes.find(n => n.id === noteId);
            return `users/${sharedNote.ownerId}/notes/${noteId}`;
          })();

      await updateDoc(doc(db, targetPath), {
        title: title,
        content: content,
        linkedNotes: extractedLinkedNotes,
        tags: tags,
        updatedAt: new Date()
      });
      
      await loadNotes();
      if (!silent) {
        toast.success('Note saved successfully!');
      }
    } catch (error) {
      if (!silent) {
        toast.error('Failed to save note');
      }
    }
  };

  const deleteNote = async (noteId) => {
    try {
      if (!isNoteOwner(noteId)) {
        toast.error('You can only delete notes you own');
        return;
      }

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
      const allNotesArray = [...notes, ...sharedNotes];
      const noteToDuplicate = allNotesArray.find(n => n.id === noteId);
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
    if (isNoteOwner(note.id)) {
      getNotesShares(note.id);
    }
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

  const allNotesArray = [...notes, ...sharedNotes];
  const sortedNotes = getSortedNotes(allNotesArray);

  return (
    <div className="App">
      <KeyboardShortcutsModal 
        isOpen={showShortcutsModal} 
        onClose={() => setShowShortcutsModal(false)} 
      />
      <CommandPalette 
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        notes={allNotesArray}
        onSelectNote={(note) => {
          handleSelectNote(note);
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
                  allNotes={allNotesArray}
                  onSave={updateNote}
                  onDelete={deleteNote}
                  onDuplicate={duplicateNote}
                  onSelectNote={handleSelectNote}
                  getNoteByTitle={getNoteByTitle}
                  getBacklinks={getBacklinks}
                  createNoteIfNotExists={createNoteIfNotExists}
                  allTags={getAllTags()}
                  onCreateNew={handleCreateNewNote}
                  onCancel={handleCancelEdit}
                  onShare={shareNote}
                  onUnshare={unshareNote}
                  isOwner={isNoteOwner(selectedNote.id)}
                  permission={getUserPermission(selectedNote.id)}
                  currentShares={noteShares[selectedNote.id] || []}
                  currentUserEmail={user.email}
                  syncStatus={syncStatus}
                />
              ) : (
                <NoteEditor 
                  note={null}
                  allNotes={allNotesArray}
                  onCreate={createNote}
                  onDelete={deleteNote}
                  onSelectNote={handleSelectNote}
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
            notes={allNotesArray} 
            onSelectNote={(note) => {
              handleSelectNote(note);
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
