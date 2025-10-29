import './DeleteConfirmModal.css';

function DeleteConfirmModal({ noteTitle, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Delete Note?</h2>
        <p>
          Are you sure you want to delete <strong>{noteTitle}</strong>? This action cannot be undone.
        </p>
        <div className="modal-actions">
          <button className="modal-cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="modal-delete-btn" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;
