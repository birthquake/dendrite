import { createContext, useState, useEffect, useCallback } from 'react';
import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create or update user document in Firestore
  const createUserDocument = useCallback(async (authUser) => {
    try {
      const userRef = doc(db, 'users', authUser.uid);
      const userSnap = await getDoc(userRef);
      
      // Only create if doesn't exist
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: authUser.email,
          createdAt: new Date(),
          uid: authUser.uid,
        });
      }
    } catch (err) {
      console.error('Error creating user document:', err);
    }
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await createUserDocument(currentUser);
      }
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, [createUserDocument]);

  // Sign up with email & password
  const signup = useCallback(async (email, password) => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await createUserDocument(result.user);
      setUser(result.user);
      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [createUserDocument]);

  // Login with email & password
  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      await createUserDocument(result.user);
      setUser(result.user);
      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [createUserDocument]);

  // Login with Google
  const loginWithGoogle = useCallback(async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await createUserDocument(result.user);
      setUser(result.user);
      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [createUserDocument]);

  // Logout
  const logout = useCallback(async () => {
    try {
      setError(null);
      await signOut(auth);
      setUser(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    signup,
    login,
    loginWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
