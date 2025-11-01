import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import './theme-toggle.css';

export function ThemeToggle() {
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    // Check localStorage for saved preference
    const savedTheme = localStorage.getItem('dendrite-theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // Default to dark theme
    return true;
  });

  useEffect(() => {
    // Apply theme to document root
    const htmlElement = document.documentElement;
    
    if (isDarkTheme) {
      htmlElement.classList.remove('light-theme');
      localStorage.setItem('dendrite-theme', 'dark');
    } else {
      htmlElement.classList.add('light-theme');
      localStorage.setItem('dendrite-theme', 'light');
    }
  }, [isDarkTheme]);

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  return (
    <button
      className="theme-toggle-btn"
      onClick={toggleTheme}
      title={isDarkTheme ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDarkTheme ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkTheme ? (
        <Sun size={20} className="theme-icon" />
      ) : (
        <Moon size={20} className="theme-icon" />
      )}
    </button>
  );
}

export default ThemeToggle;
