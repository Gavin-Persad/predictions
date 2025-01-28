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
    const fetchProfile = async () => {
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

    fetchProfile();
  }, []);

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

  const handleDeleteAccount = async () => {
    if (!profile) return;

    const confirmed = window.confirm('Are you sure you want to delete your account? This action cannot be undone.');
    if (!confirmed) return;

    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profile.id);

    if (deleteError) {
      setMessage('Error deleting account');
    } else {
      const { error: authError } = await supabase.auth.admin.deleteUser(profile.id);
      if (authError) {
        setMessage('Error deleting authentication');
      } else {
        setMessage('Account deleted successfully');
        router.push('/');
      }
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
        <Sidebar />
        <div className="absolute top-4 right-4">
            <DarkModeToggle />
        </div>
        <div className="container mx-auto p-4 pl-24">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => router.push('/dashboard')}
                    className="mb-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                >
                    Back to Dashboard
                </button>
                <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                    Profile Settings
                </h1>
                <div className="bg-white dark:bg-gray-800 p-8 rounded shadow-md">
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
                    <button
                        onClick={handleDeleteAccount}
                        className="w-full mt-4 bg-red-600 text-white py-2 rounded hover:bg-red-700 transition duration-300"
                    >
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
    </div>
);
}