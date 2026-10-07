import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, signInWithGoogle, logoutFirebase, handleFirestoreError } from '../firebase.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('chatx_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  const [fbUser, setFbUser] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Sync user profile with Firestore and local backend
  const syncUserProfile = useCallback(async (firebaseUser) => {
    if (!firebaseUser) return;
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      let userDocSnap;
      try {
        userDocSnap = await getDoc(userRef);
      } catch (err) {
        handleFirestoreError(err, 'get', `users/${firebaseUser.uid}`);
      }

      let profileData;
      if (userDocSnap && userDocSnap.exists()) {
        profileData = userDocSnap.data();
      } else {
        const usernameBase = (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'user')
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '');
        profileData = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'ChatX User',
          username: usernameBase,
          email: firebaseUser.email || '',
          avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(firebaseUser.displayName || 'ChatX')}&backgroundColor=b6e3f4`,
          bio: 'Hey there! I am using ChatX ⚡',
          phone: firebaseUser.phoneNumber || '',
          online: true,
          lastSeen: new Date().toISOString()
        };

        try {
          await setDoc(userRef, profileData, { merge: true });
        } catch (err) {
          handleFirestoreError(err, 'write', `users/${firebaseUser.uid}`);
        }
      }

      // Also register or sync with Express backend so WebSockets & calling server recognize user
      try {
        await fetch('/api/auth/sync-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: profileData.id,
            name: profileData.name,
            username: profileData.username,
            email: profileData.email,
            avatar: profileData.avatar,
            bio: profileData.bio,
            phone: profileData.phone
          })
        });
      } catch {
        // Backend might already have user, ignore conflict
      }

      setCurrentUser(profileData);
      localStorage.setItem('chatx_user', JSON.stringify(profileData));
    } catch (err) {
      console.error('Error syncing Firebase user profile:', err);
    }
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFbUser(user);
      if (user) {
        await syncUserProfile(user);
      }
      setAuthInitialized(true);
    });

    return () => unsubscribe();
  }, [syncUserProfile]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users', {
        headers: { 'x-user-id': currentUser?.id || '' }
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('chatx_user', JSON.stringify(currentUser));
      fetchUsers();
    }
  }, [currentUser, fetchUsers]);

  // Google Sign-In with Firebase Auth
  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.user) {
        await syncUserProfile(result.user);
      }
      return result.user;
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to login');
      }
      setCurrentUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register');
      }
      setCurrentUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      // Update in Firestore if logged in with Firebase
      if (auth.currentUser && currentUser.id === auth.currentUser.uid) {
        try {
          const userRef = doc(db, 'users', currentUser.id);
          await setDoc(userRef, profileData, { merge: true });
        } catch (err) {
          handleFirestoreError(err, 'write', `users/${currentUser.id}`);
        }
      }

      // Also update in Express backend
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ ...profileData, id: currentUser.id })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setCurrentUser(data.user);
        return data.user;
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      throw err;
    }
  };

  const switchUser = (user) => {
    setCurrentUser(user);
    localStorage.setItem('chatx_user', JSON.stringify(user));
  };

  const logout = async () => {
    try {
      if (auth.currentUser) {
        await logoutFirebase();
      }
    } catch (err) {
      console.error('Error logging out of Firebase:', err);
    }
    localStorage.removeItem('chatx_user');
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        fbUser,
        availableUsers,
        loading,
        authInitialized,
        loginWithGoogle,
        login,
        register,
        logout,
        updateProfile,
        switchUser,
        fetchUsers
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
