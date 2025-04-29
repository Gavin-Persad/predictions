//src/app/dashboard/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../supabaseClient';
import Sidebar from '../../components/Sidebar';
import DarkModeToggle from '../../components/darkModeToggle';
import Link from 'next/link';

import MessagesPanel from './components/MessagesPanel';
import CurrentGameWeekTile from './components/CurrentGameWeekTile';
import LeagueTableTile from './components/LeagueTableTile';
import GeorgeCupTile from './components/GeorgeCupTile';
import LaveryCupTile from './components/LaveryCupTile';
import RulesTile from './components/RulesTile';

type UserProfile = {
  id: string;
  username: string;
  full_name: string | null;
  is_host: boolean;
};

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const getProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/');
          return;
        }
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (error) throw error;
        
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    getProfile();
  }, [router]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-grow flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
        {/* Top bar with dark mode toggle and profile link */}
        <div className="w-full flex justify-end items-center p-4 bg-white dark:bg-gray-800 shadow-sm">
          <div className="flex items-center gap-4">
      
            <Link href="/profilesettings" className="text-gray-700 dark:text-gray-200 hover:text-blue-500 dark:hover:text-blue-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </Link>
            <DarkModeToggle />
          </div>
        </div>
        
        <div className="p-4 md:p-6 lg:p-8">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
            {profile?.username}'s Dashboard
          </h1>
          
          {/* Messages Panel */}
          <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Notice Board</h2>
            <MessagesPanel isHost={profile?.is_host || false} />
          </div>
          
          {/* Main Tiles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Game Week */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Current Game Week</h2>
              <CurrentGameWeekTile />
            </div>
            
            {/* League Table */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">League Table</h2>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded min-h-[150px] flex items-center justify-center">
                <p className="text-gray-600 dark:text-gray-300 text-center">League standings will appear here</p>
              </div>
            </div>
            
            {/* George Cup */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">George Cup</h2>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded min-h-[150px] flex items-center justify-center">
                <p className="text-gray-600 dark:text-gray-300 text-center">George Cup status will appear here</p>
              </div>
            </div>
            
            {/* Lavery Cup */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Lavery Cup</h2>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded min-h-[150px] flex items-center justify-center">
                <p className="text-gray-600 dark:text-gray-300 text-center">Lavery Cup status will appear here</p>
              </div>
            </div>
          </div>
          
          {/* Rules Tile (Full Width) */}
          <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <RulesTile />
          </div>
        </div>
      </div>
    </div>
  );
}