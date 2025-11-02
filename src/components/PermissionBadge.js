import './PermissionBadge.css';

export function PermissionBadge({ permission, size = 'md' }) {
  const getColorClass = () => {
    switch (permission) {
      case 'view':
        return 'badge-view';
      case 'edit':
        return 'badge-edit';
      case 'admin':
        return 'badge-admin';
      default:
        return 'badge-default';
    }
  };

  const getDisplayText = () => {
    switch (permission) {
      case 'view':
        return 'View Only';
      case 'edit':
        return 'Can Edit';
      case 'admin':
        return 'Admin';
      default:
        return 'Unknown';
    }
  };

  return (
    <span className={`permission-badge ${getColorClass()} badge-${size}`}>
      {getDisplayText()}
    </span>
  );
}

export default PermissionBadge;
