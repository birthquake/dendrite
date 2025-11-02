import { useState } from 'react';
import { Mail, Lock, UserPlus, Loader, AlertCircle, Brain, Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import './Auth.css';

export function Signup({ onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, loginWithGoogle } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await signup(email, password);
    } catch (err) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setLoading(true);

    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message || 'Failed to sign up with Google');
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordLongEnough = password && password.length >= 6;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <Brain size={32} />
          </div>
          <h1>Dendrite</h1>
          <p>Your second brain for notes</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <Mail size={18} className="auth-input-icon" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="auth-input-group">
            <Lock size={18} className="auth-input-icon" />
            <input
              type="password"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            {passwordLongEnough && (
              <Check size={18} className="auth-input-icon success" />
            )}
          </div>

          <div className="auth-input-group">
            <Lock size={18} className="auth-input-icon" />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
            {passwordsMatch && (
              <Check size={18} className="auth-input-icon success" />
            )}
          </div>

          {error && (
            <div className="auth-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={loading} className="auth-submit-btn">
            {loading ? (
              <>
                <Loader size={18} className="spinner" />
                Creating account...
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="auth-divider">or continue with</div>

        <button
          type="button"
          className="auth-google-btn"
          onClick={handleGoogleSignup}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign up with Google
        </button>

        <p className="auth-switch">
          Already have an account?{' '}
          <button type="button" onClick={onSwitchToLogin}>
            Login
          </button>
        </p>
      </div>
    </div>
  );
}
