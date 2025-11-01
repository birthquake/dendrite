import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';
import { Login } from './Login';
import { Signup } from './Signup';

export function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const [showSignup, setShowSignup] = useState(false);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading Dendrite...</p>
      </div>
    );
  }

  if (!user) {
    return showSignup ? (
      <Signup onSwitchToLogin={() => setShowSignup(false)} />
    ) : (
      <Login onSwitchToSignup={() => setShowSignup(true)} />
    );
  }

  return children;
}
