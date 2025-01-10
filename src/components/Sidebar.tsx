// src/components/Sidebar.tsx

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../supabaseClient';

type SidebarProps = {
  loggedIn: boolean;
  isHost?: boolean;
  username?: string;
};

export default function Sidebar({ loggedIn, isHost, username }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="relative">
      <div className="fixed top-4 left-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-gray-800 text-white rounded-full focus:outline-none"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            ></path>
          </svg>
        </button>
      </div>
      <div
        className={`fixed top-0 left-0 h-full bg-gray-800 dark:bg-gray-700 text-white dark:text-gray-200 transition-transform transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64 p-4`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Menu</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 bg-gray-800 dark:bg-gray-700 text-white dark:text-gray-200 rounded-full focus:outline-none"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>
        {username && <p className="mb-4">Welcome, {username}</p>}
        <nav>
          <ul>
            {loggedIn ? (
              <>
                <li className="mb-2">
                  <Link href="/dashboard">
                    <span className="block px-4 py-2 hover:bg-gray-700 dark:hover:bg-gray-600 rounded cursor-pointer">Dashboard</span>
                  </Link>
                </li>
                <li className="mb-2">
                  <Link href="/enterscores">
                    <span className="block px-4 py-2 hover:bg-gray-700 dark:hover:bg-gray-600 rounded cursor-pointer">Enter Score</span>
                  </Link>
                </li>
                <li className="mb-2">
                  <Link href="/viewseason">
                    <span className="block px-4 py-2 hover:bg-gray-700 dark:hover:bg-gray-600 rounded cursor-pointer">View Season</span>
                  </Link>
                </li>
                {isHost && (
                  <li className="mb-2">
                    <Link href="/createseason">
                      <span className="block px-4 py-2 hover:bg-gray-700 dark:hover:bg-gray-600 rounded cursor-pointer">Create Season</span>
                    </Link>
                  </li>
                )}
                <li className="mb-2">
                  <Link href="/profilesettings">
                    <span className="block px-4 py-2 hover:bg-gray-700 dark:hover:bg-gray-600 rounded cursor-pointer">Profile Settings</span>
                  </Link>
                </li>
                <li className="mb-2">
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 dark:hover:bg-gray-600 rounded"
                  >
                    Sign Out
                  </button>
                </li>
              </>
            ) : (
              <li className="mb-2">
                <button
                    onClick={() => {
                      handleSignOut();
                      router.push('/');
                    }}
                    className="login-signup-button"
                  >
                    Login / Sign Up
                  </button>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </div>
  );
}