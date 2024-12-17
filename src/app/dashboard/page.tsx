// src/app/dashboard/page.tsx

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../supabaseClient';
import Image from 'next/image';
import useDarkMode from '../../hooks/useDarkMode';

type UserProfile = {
  id: string;
  username: string;
  is_host: boolean;
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [message, setMessage] = useState('');
  const [darkMode, setDarkMode] = useDarkMode();
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        setMessage('Error fetching session');
        return;
      }

      const user = session.user;
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, is_host')
          .eq('id', user.id)
          .single();
        if (profileError) {
          setMessage('Error fetching user profile');
        } else {
          setProfile(profile);
        }
      }
    };

    fetchProfile();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setMessage('Error signing out');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="absolute top-4 left-4">
        {profile && (
          <>
            <p className="text-lg text-gray-900 dark:text-gray-100">Hello, {profile.username}</p>
            <button
              onClick={handleSignOut}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Sign Out
            </button>
          </>
        )}
      </div>
      <div className="absolute top-4 right-4">
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
      </div>
      <div className="bg-white dark:bg-gray-800 p-8 rounded shadow-md w-full max-w-4xl">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Dashboard</h1>
        {message && <p className="mb-4 text-red-500 dark:text-red-400">{message}</p>}
        {profile && profile.is_host && (
          <div className="mb-4 text-center">
            <button
              onClick={() => router.push('/createseason')}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Create Season
            </button>
          </div>
        )}
        {profile && (
          <div className="mb-4 text-center">
            <button
              onClick={() => router.push('/enterscores')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Enter Scores
            </button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800">
            <thead>
              <tr>
                <th className="py-2 text-gray-700 dark:text-gray-300">Player</th>
                <th className="py-2 text-gray-700 dark:text-gray-300">Club</th>
                <th className="py-2 text-gray-700 dark:text-gray-300">Correct Scores</th>
                <th className="py-2 text-gray-700 dark:text-gray-300">Points</th>
              </tr>
            </thead>
            <tbody>
              {/* Placeholder for league table data */}
              <tr>
                <td className="py-2 text-gray-900 dark:text-gray-100">-</td>
                <td className="py-2 text-gray-900 dark:text-gray-100">-</td>
                <td className="py-2 text-gray-900 dark:text-gray-100">-</td>
                <td className="py-2 text-gray-900 dark:text-gray-100">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}