// src/app/profileSettings/page.tsx

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../supabaseClient';
import DarkModeToggle from '../../components/darkModeToggle';
import Sidebar from '../../components/Sidebar';

type UserProfile = {
  id: string;
  username: string;
  club: string;
  is_host: boolean;
};

export default function ProfileSettings() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [username, setUsername] = useState('');
  const [club, setClub] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndFetchProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            router.push('/');
            return;
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            setMessage('Error fetching user');
            return;
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, username, club, is_host')
            .eq('id', user.id)
            .single();

        if (profileError) {
            setMessage('Error fetching user profile');
        } else {
            setProfile(profile);
            setUsername(profile.username || '');
            setClub(profile.club || '');
        }
    };

    checkAuthAndFetchProfile();
}, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const { error } = await supabase
      .from('profiles')
      .update({ username, club })
      .eq('id', profile.id);

    if (error) {
      setMessage('Error updating profile');
    } else {
      setMessage('Profile updated successfully');
    }
  };

  return (
    <div className="flex">
        <Sidebar />
        <div className="flex-grow flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="absolute top-4 right-4">
                <DarkModeToggle />
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded shadow-md w-full max-w-4xl">
                <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
                    Profile Settings
                </h1>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="mb-8 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                >
                    Back to Dashboard
                </button>
                {message && (
                    <p className="mb-4 text-red-500 dark:text-red-400">{message}</p>
                )}
                <form onSubmit={handleUpdateProfile}>
                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="username">
                            Display Name
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="club">
                            Favorite Club
                        </label>
                        <input
                            id="club"
                            type="text"
                            value={club}
                            onChange={(e) => setClub(e.target.value)}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition duration-300"
                    >
                        Update Profile
                    </button>
                </form>
                
                <div className="mt-8 p-4 border border-red-200 rounded bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                    <p className="text-red-700 dark:text-red-400 text-center">
                        To delete your account, please contact <a href="mailto:gavinapersad@gmail.com" className="underline">gavinapersad@gmail.com</a> with your request.
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
}