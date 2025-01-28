//app/admin/page.tsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { useRouter } from 'next/navigation';
import DarkModeToggle from '../../components/darkModeToggle';
import Sidebar from '../../components/Sidebar';

type UserProfile = {
  id: string;
  username: string;
  is_host: boolean;
};

export default function AdminPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/');
        return;
      }

      const { data: currentUserProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, is_host')
        .eq('id', user.id)
        .single();

      if (profileError || !currentUserProfile?.is_host) {
        router.push('/');
        return;
      }

      setCurrentProfile(currentUserProfile);

      const { data: allProfiles, error: allProfilesError } = await supabase
        .from('profiles')
        .select('id, username, is_host');

      if (allProfilesError) {
        setMessage('Error fetching profiles');
      } else {
        setProfiles(allProfiles);
       
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);
      }
    };

    fetchProfiles();
  }, [router]);

  const toggleHostStatus = async (profileId: string, currentStatus: boolean) => {
    setMessage('');
    const { error } = await supabase
    .from('profiles')
    .update({ is_host: !currentStatus })
    .eq('id', profileId)
    .select();
  
  if (error) {
    setMessage('Error updating host status');
    return;
  }
  
    setProfiles(profiles.map(profile => 
      profile.id === profileId 
        ? { ...profile, is_host: !currentStatus }
        : profile
    ));
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
        <Sidebar />
        <div className="absolute top-4 right-4">
            <DarkModeToggle />
        </div>
        <div className="container mx-auto p-4 pl-24">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                    Admin Dashboard
                </h1>
                <div className="bg-white dark:bg-gray-800 p-8 rounded shadow-md">
                    {message && (
                        <p className="mb-4 text-red-500 dark:text-red-400">{message}</p>
                    )}
                    {!isLoading && (
                        <div className="w-full">
                            <table className="w-full">
                                <thead>
                                    <tr>
                                        <th className="py-2 text-left text-gray-700 dark:text-gray-300">Username</th>
                                        <th className="py-2 text-center text-gray-700 dark:text-gray-300">Host</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {profiles.map((profile) => (
                                        <tr key={profile.id} className="border-t border-gray-200 dark:border-gray-700">
                                            <td className="py-3 text-gray-900 dark:text-gray-100">
                                                {profile.username}
                                            </td>
                                            <td className="py-3 text-center">
                                                <button
                                                    onClick={() => toggleHostStatus(profile.id, profile.is_host)}
                                                    className={`px-4 py-2 rounded ${
                                                        profile.is_host
                                                            ? 'bg-green-600 hover:bg-green-700'
                                                            : 'bg-gray-600 hover:bg-gray-700'
                                                    } text-white transition-colors duration-200`}
                                                >
                                                    {profile.is_host ? 'Yes' : 'No'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
);
}