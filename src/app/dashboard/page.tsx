// src/app/dashboard/page.tsx

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../supabaseClient';
import DarkModeToggle from '../../components/darkModeToggle';
import LeagueTable from '../../components/leagueTable';
import Link from 'next/link';

type UserProfile = {
  id: string;
  username: string;
  is_host: boolean;
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        setMessage('');
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
        {profile ? (
          <>
            <p className="text-lg text-gray-900 dark:text-gray-100">Hello, {profile.username}</p>
            <button
              onClick={handleSignOut}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Sign Out
            </button>
          </>
        ) : (
            <Link href="/">
            <span className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 cursor-pointer">
                Click here to log in
            </span>
            </Link>
        )}
      </div>
      <div className="absolute top-4 right-4">
        <DarkModeToggle />
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
        <LeagueTable />
      </div>
    </div>
  );
}