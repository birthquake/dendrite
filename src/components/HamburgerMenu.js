import { Menu, X } from 'lucide-react';
import './hamburger-menu.css';

export function HamburgerMenu({ isOpen, onToggle }) {
  return (
    <button
      className="hamburger-menu-btn"
      onClick={onToggle}
      title={isOpen ? 'Close sidebar' : 'Open sidebar'}
      aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
      aria-expanded={isOpen}
    >
      {isOpen ? (
        <X size={24} className="hamburger-icon" />
      ) : (
        <Menu size={24} className="hamburger-icon" />
      )}
    </button>
  );
}

export default HamburgerMenu;
