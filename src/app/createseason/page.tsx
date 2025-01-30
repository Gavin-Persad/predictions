// src/app/createseason/page.tsx

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../supabaseClient';
import DarkModeToggle from '../../components/darkModeToggle';
import Sidebar from '../../components/Sidebar';
import SeasonConfirmationModal from '../../components/SeasonConfirmationModal';

type UserProfile = {
  id: string;
  username: string;
  is_host?: boolean;
};

export default function CreateSeason() {
  const [seasonName, setSeasonName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');
  const [allPlayers, setAllPlayers] = useState<UserProfile[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<UserProfile[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
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
      } else {
          setSelectedPlayers([...selectedPlayers, player]);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            setMessage('Error fetching user');
            return;
        }

        const { data, error } = await supabase
            .from('seasons')
            .insert([
                {
                    name: seasonName,
                    start_date: startDate,
                    end_date: endDate,
                    host_id: user.id
                },
            ])
            .select()
            .single();

        if (error) throw error;


        await Promise.all(
          selectedPlayers.map(player =>
              supabase
                  .from('season_players')
                  .insert([{ season_id: data.id, player_id: player.id }])
          )
      );

      router.push('/viewseason');
  } catch (error) {
      console.error('Error:', error);
      setMessage('Error creating season');
  }
  setShowConfirmation(false);
};

  if (!profile?.is_host) {
      return <div>You must be a host to create seasons.</div>;
  }

  return (
    <div className="flex">
        <div className="flex-grow flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 p-8 rounded shadow-md w-full max-w-4xl">
                <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Create Season</h1>
                {message && <p className="mb-4 text-red-500">{message}</p>}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-3 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Season Name</label>
                                <input
                                    type="text"
                                    value={seasonName}
                                    onChange={(e) => setSeasonName(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className="md:col-span-3 grid grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Not Taking Part</h3>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {allPlayers
                                        .filter(player => !selectedPlayers.some(p => p.id === player.id))
                                        .map(player => (
                                            <div
                                                key={player.id}
                                                onClick={() => handlePlayerClick(player, false)}
                                                className="p-2 rounded cursor-pointer bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                                            >
                                                {player.username}
                                            </div>
                                        ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Taking Part</h3>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {selectedPlayers.map(player => (
                                        <div
                                            key={player.id}
                                            onClick={() => handlePlayerClick(player, true)}
                                            className="p-2 rounded cursor-pointer bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800"
                                        >
                                            {player.username}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-300"
                    >
                        Create Season
                    </button>
                </form>
            </div>
        </div>

        {showConfirmation && (
            <SeasonConfirmationModal
                seasonData={{
                    name: seasonName,
                    startDate: startDate,
                    endDate: endDate,
                    players: selectedPlayers
                }}
                onConfirm={handleConfirm}
                onCancel={() => setShowConfirmation(false)}
            />
        )}
    </div>
);
}