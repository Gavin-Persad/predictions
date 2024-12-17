// src/hooks/useDarkMode.ts

import { useState, useEffect } from 'react';

export default function useDarkMode() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Load dark mode preference from local storage
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Save dark mode preference to local storage
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  return [darkMode, setDarkMode] as const;
}