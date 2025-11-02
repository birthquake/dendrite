import { useState } from 'react';
import { X } from 'lucide-react';
import './ShareModal.css';

export function ShareModal({
  isOpen,
  onClose,
  onShare,
  currentShares = [],
  currentUserEmail,
  note,
}) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('view');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (email.toLowerCase() === currentUserEmail.toLowerCase()) {
      setError('You cannot share a note with yourself');
      return;
    }

    const alreadyShared = currentShares.some(
      (share) => share.email.toLowerCase() === email.toLowerCase()
    );

    if (alreadyShared) {
      setError('This note is already shared with that email');
      return;
    }

    try {
      setIsLoading(true);
      await onShare(note.id, email.toLowerCase(), permission);
      setEmail('');
      setPermission('view');
      setError('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to share note');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="share-modal-overlay" onClick={onClose} />
      <div className="share-modal">
        <div className="share-modal-header">
          <h3>Share Note</h3>
          <button
            className="share-modal-close"
            onClick={onClose}
            aria-label="Close modal"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="share-modal-content">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="share-email">Email Address</label>
              <input
                id="share-email"
                type="email"
                className="share-email-input"
                placeholder="collaborator@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                disabled={isLoading}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="share-permission">Permission Level</label>
              <select
                id="share-permission"
                className="share-permission-select"
                value={permission}
                onChange={(e) => setPermission(e.target.value)}
                disabled={isLoading}
              >
                <option value="view">View Only - Can read the note</option>
                <option value="edit">Can Edit - Can modify the note</option>
                <option value="admin">Admin - Can edit and share with others</option>
              </select>
              <p className="permission-description">
                {permission === 'view' &&
                  'User can view the note but cannot make changes.'}
                {permission === 'edit' &&
                  'User can view and edit the note content.'}
                {permission === 'admin' &&
                  'User has full control and can share with others.'}
              </p>
            </div>

            {error && <div className="share-modal-error">{error}</div>}

            <div className="share-modal-actions">
              <button
                type="button"
                className="share-modal-btn share-modal-btn-cancel"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="share-modal-btn share-modal-btn-share"
                disabled={isLoading || !email.trim()}
              >
                {isLoading ? 'Sharing...' : 'Share Note'}
              </button>
            </div>
          </form>

          {currentShares.length > 0 && (
            <div className="share-modal-current">
              <p className="share-modal-current-label">
                Already shared with {currentShares.length} user{currentShares.length !== 1 ? 's' : ''}
              </p>
              <ul className="share-modal-current-list">
                {currentShares.map((share) => (
                  <li key={share.uid}>{share.email}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default ShareModal;
