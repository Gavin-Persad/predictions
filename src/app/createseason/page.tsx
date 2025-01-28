// src/app/createseason/page.tsx

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../supabaseClient';
import DarkModeToggle from '../../components/darkModeToggle';
import Sidebar from '../../components/Sidebar';

type UserProfile = {
  id: string;
  username: string;
  is_host?: boolean;
};

export default function CreateSeason() {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [allPlayers, setAllPlayers] = useState<UserProfile[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<UserProfile[]>([]);
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
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
        .select('id, username, is_host')
        .eq('id', user.id)
        .single();
      if (profileError) {
        setMessage('Error fetching user profile');
      } else {
        setProfile(profile);
      }
    };

    const fetchPlayers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username');
      if (error) {
        setMessage('Error fetching players');
      } else {
        setAllPlayers(data);
      }
    };

    fetchProfile();
    fetchPlayers();
  }, []);

  const handlePlayerClick = (player: UserProfile, isSelected: boolean) => {
    if (isSelected) {
      setSelectedPlayers(selectedPlayers.filter(p => p.id !== player.id));
      setAllPlayers([...allPlayers, player]);
    } else {
      setAllPlayers(allPlayers.filter(p => p.id !== player.id));
      setSelectedPlayers([...selectedPlayers, player]);
    }
  };

  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setMessage('Error fetching user');
      return;
    }

    const { data: season, error: seasonError } = await supabase
      .from('seasons')
      .insert([{ name, start_date: startDate, end_date: endDate, host_id: user.id }])
      .select()
      .single();
    if (seasonError) {
      setMessage('Error creating season');
      return;
    }

    const { error: playersError } = await supabase
      .from('season_players')
      .insert(selectedPlayers.map(player => ({ season_id: season.id, player_id: player.id })));
    if (playersError) {
      setMessage('Error adding players to season');
      return;
    }

    setMessage('Season created successfully');
    router.push('/dashboard');
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-grow flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="absolute top-4 right-4">
          <DarkModeToggle />
        </div>
        <div className="bg-white dark:bg-gray-800 p-8 rounded shadow-md w-full max-w-4xl">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Create Season</h1>
          {message && <p className="mb-4 text-red-500 dark:text-red-400">{message}</p>}
          <form onSubmit={handleCreateSeason} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Season Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div className="flex space-x-4">
              <div className="w-1/2">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Not Taking Part</h3>
                <ul className="mt-2 space-y-2">
                  {allPlayers.map(player => (
                    <li key={player.id} className="cursor-pointer" onClick={() => handlePlayerClick(player, false)}>
                      <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded shadow hover:bg-gray-300 dark:hover:bg-gray-600">
                        {player.username}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="w-1/2">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Taking Part</h3>
                <ul className="mt-2 space-y-2">
                  {selectedPlayers.map(player => (
                    <li key={player.id} className="cursor-pointer" onClick={() => handlePlayerClick(player, true)}>
                      <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded shadow hover:bg-gray-300 dark:hover:bg-gray-600">
                        {player.username}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create Season
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}