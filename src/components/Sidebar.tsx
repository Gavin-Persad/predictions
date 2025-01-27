// src/components/Sidebar.tsx

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../supabaseClient';

type UserProfile = {
    username: string;
    is_host: boolean;
};

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
                console.error('Error fetching session:', error.message);
            } else {
                setSession(session);
                if (session?.user) {
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('username, is_host')
                        .eq('id', session.user.id)
                        .single();
                    setProfile(profileData);
                }
            }
        };
        checkSession();
    }, []);

    return (
      <div className="relative">
      {!isOpen && (
          <button
              onClick={() => setIsOpen(true)}
              className="fixed top-4 left-4 z-50 w-10 h-10 flex items-center justify-center bg-gray-800 text-white rounded-full hover:bg-gray-700"
          >
              ☰
          </button>
      )}

      <div className={`fixed top-0 left-0 h-full bg-gray-800 text-white transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
      } w-64 p-4 z-40`}>
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold">Menu</h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-gray-700 rounded-full"
                    >
                        ✕
                    </button>
                </div>

                {profile?.username && (
                    <p className="mb-4 px-4">Welcome, {profile.username}</p>
                )}

                <nav>
                    <ul>
                        <li>
                            <Link href="/dashboard">
                                <span className="block px-4 py-2 hover:bg-gray-700 rounded">Dashboard</span>
                            </Link>
                        </li>
                        <li>
                            <Link href="/enterscores">
                                <span className="block px-4 py-2 hover:bg-gray-700 rounded">Enter Predictions</span>
                            </Link>
                        </li>
                        <li>
                            <Link href="/viewseason">
                                <span className="block px-4 py-2 hover:bg-gray-700 rounded">View Season</span>
                            </Link>
                        </li>
                        {profile?.is_host && (
                            <li>
                                <Link href="/createseason">
                                    <span className="block px-4 py-2 hover:bg-gray-700 rounded">Create Season</span>
                                </Link>
                            </li>
                        )}
                        <li>
                            <Link href="/profilesettings">
                                <span className="block px-4 py-2 hover:bg-gray-700 rounded">Profile Settings</span>
                            </Link>
                        </li>
                        <li>
                            <button
                                onClick={async () => {
                                    await supabase.auth.signOut();
                                    router.push('/');
                                }}
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
}