// src/components/DarkModeToggle.tsx

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function DarkModeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="p-2 bg-gray-200 dark:bg-gray-800 rounded-full focus:outline-none"
    >
      {darkMode ? (
        <Image src="/icons/darkMode/sun.png" alt="Light Mode" width={24} height={24} />
      ) : (
        <Image src="/icons/darkMode/moon.png" alt="Dark Mode" width={24} height={24} />
      )}
    </button>
  );
}