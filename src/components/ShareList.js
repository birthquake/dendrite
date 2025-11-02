import { X } from 'lucide-react';
import { PermissionBadge } from './PermissionBadge';
import './ShareList.css';

export function ShareList({ shares, isOwner, onRemoveShare }) {
  if (!shares || shares.length === 0) {
    return (
      <div className="share-list">
        <p className="share-list-empty">This note hasn't been shared yet.</p>
      </div>
    );
  }

  return (
    <div className="share-list">
      <div className="share-list-header">
        <h4>Shared with ({shares.length})</h4>
      </div>
      
      <div className="share-list-items">
        {shares.map((share) => (
          <div key={share.uid} className="share-list-item">
            <div className="share-item-content">
              <div className="share-item-email">{share.email}</div>
              <PermissionBadge permission={share.permission} size="sm" />
              {share.sharedAt && (
                <span className="share-item-date">
                  Shared {new Date(share.sharedAt.toDate?.() || share.sharedAt).toLocaleDateString()}
                </span>
              )}
            </div>

            {isOwner && (
              <button
                className="share-remove-btn"
                onClick={() => onRemoveShare(share.uid)}
                title={`Revoke ${share.email}'s access`}
                aria-label="Remove share"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ShareList;
