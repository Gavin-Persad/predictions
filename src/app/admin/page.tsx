//app/admin/page.tsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import DarkModeToggle from '../../components/darkModeToggle';
import Sidebar from '../../components/Sidebar';

type UserProfile = {
  id: string;
  username: string;
  is_host: boolean;
};

export default function AdminPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setMessage('Error fetching user');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, is_host')
        .eq('id', user.id)
        .single();
      if (profileError) {
        setMessage('Error fetching user profile');
      } else {
        setProfile(profile);
        setLoggedIn(true);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div className="flex">
      <Sidebar username={profile?.username} isHost={profile?.is_host} loggedIn={loggedIn} />
      <div className="flex-grow flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="absolute top-4 right-4">
          <DarkModeToggle />
        </div>
        <div className="bg-white dark:bg-gray-800 p-8 rounded shadow-md w-full max-w-4xl">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Admin Page</h1>
          {message && <p className="mb-4 text-red-500 dark:text-red-400">{message}</p>}
          <table className="min-w-full bg-white dark:bg-gray-800">
            <thead>
              <tr>
                <th className="py-2 text-gray-700 dark:text-gray-300">Username</th>
                <th className="py-2 text-gray-700 dark:text-gray-300">Host</th>
              </tr>
            </thead>
            <tbody>
              {profile && (
                <tr key={profile.id}>
                  <td className="py-2 text-gray-900 dark:text-gray-100">{profile.username}</td>
                  <td className="py-2 text-gray-900 dark:text-gray-100">{profile.is_host ? 'Yes' : 'No'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}