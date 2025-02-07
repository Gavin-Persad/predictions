//src/app/dashboard/page.tsx

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../supabaseClient';
import DarkModeToggle from '../../components/darkModeToggle';
import Sidebar from '../../components/Sidebar';

type UserProfile = {
  id: string;
  username: string;
  is_host: boolean;
};

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const checkAuthAndFetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/');
        return;
      }
  
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, is_host')
        .eq('id', session.user.id)
        .single();
  
      if (profileError) {
        setMessage('Error fetching user profile');
      } else {
        setProfile(profile);
      }
    };
  
    checkAuthAndFetchProfile();
  }, [router]);



  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-grow flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="absolute top-4 right-4">
          <DarkModeToggle />
        </div>
        <div className="bg-white dark:bg-gray-800 p-8 rounded shadow-md w-full max-w-4xl">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Dashboard</h1>
          {profile && (
            <p className="text-lg text-gray-900 dark:text-gray-100 mb-6">Welcome, {profile.username}</p>
          )}
          {message && <p className="mb-4 text-red-500 dark:text-red-400">{message}</p>}
          <p className="text-center text-gray-600 dark:text-gray-400 italic">Page under construction</p>
        </div>
      </div>
    </div>
  );
}