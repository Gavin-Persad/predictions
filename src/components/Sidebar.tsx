// src/components/Sidebar.tsx

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../supabaseClient';

type SidebarProps = {
  username: string;
  isHost: boolean;
};

export default function Sidebar({ username, isHost }: SidebarProps) {
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
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2">
        <p className="text-lg text-gray-900 dark:text-gray-100">Welcome, {username}</p>
      </div>
      <div
        className={`fixed top-0 left-0 h-full bg-gray-800 text-white transition-transform transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64 p-4`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Menu</h2>
          <button
            onClick={() => setIsOpen(false)}
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
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>
        <nav>
          <ul>
            <li className="mb-2">
              <Link href="/enterscores">
                <span className="block px-4 py-2 hover:bg-gray-700 rounded cursor-pointer">Enter Scores</span>
              </Link>
            </li>
            <li className="mb-2">
              <Link href="/viewseason">
                <span className="block px-4 py-2 hover:bg-gray-700 rounded cursor-pointer">View Season</span>
              </Link>
            </li>
            {isHost && (
              <li className="mb-2">
                <Link href="/createseason">
                  <span className="block px-4 py-2 hover:bg-gray-700 rounded cursor-pointer">Create League</span>
                </Link>
              </li>
            )}
            <li className="mb-2">
              <Link href="/profilesettings">
                <span className="block px-4 py-2 hover:bg-gray-700 rounded cursor-pointer">Profile Settings</span>
              </Link>
            </li>
            <li className="mb-2">
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 hover:bg-gray-700 rounded"
              >
                Sign Out
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};