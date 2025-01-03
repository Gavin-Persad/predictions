// src/app/viewseason/page.tsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { useRouter } from 'next/navigation';
import DarkModeToggle from '../../components/darkModeToggle';
import Sidebar from '../../components/Sidebar';

type Season = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
};

type Player = {
  id: string;
  username: string;
};

type UserProfile = {
  id: string;
  username: string;
  is_host?: boolean;
};

export default function ViewSeason() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
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

    const fetchSeasons = async () => {
      const { data, error } = await supabase
        .from('seasons')
        .select('id, name, start_date, end_date');
      if (error) {
        setMessage('Error fetching seasons');
      } else {
        setSeasons(data);
      }
    };

    fetchProfile();
    fetchSeasons();
  }, []);

  const handleSeasonClick = async (season: Season) => {
    setSelectedSeason(season);
    const { data, error } = await supabase
      .from('season_players')
      .select('player_id, profiles(username)')
      .eq('season_id', season.id);
    if (error) {
      setMessage('Error fetching players for the season');
    } else {
      setPlayers(data.map((sp: any) => ({ id: sp.player_id, username: sp.profiles.username })));
    }
  };

  return (
    <div className="flex">
      <Sidebar loggedIn={!!profile} isHost={profile?.is_host} />
      <div className="flex-grow flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="absolute top-4 right-4">
          <DarkModeToggle />
        </div>
        <div className="bg-white dark:bg-gray-800 p-8 rounded shadow-md w-full max-w-4xl">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">View Seasons</h1>
          {message && <p className="mb-4 text-red-500 dark:text-red-400">{message}</p>}
          {!selectedSeason ? (
            <ul className="space-y-4">
              {seasons.map(season => (
                <li key={season.id} className="cursor-pointer" onClick={() => handleSeasonClick(season)}>
                  <div className="p-4 bg-gray-200 dark:bg-gray-700 rounded shadow hover:bg-gray-300 dark:hover:bg-gray-600">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{season.name}</h2>
                    <p className="text-gray-700 dark:text-gray-300">Start Date: {season.start_date}</p>
                    <p className="text-gray-700 dark:text-gray-300">End Date: {season.end_date}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div>
              <button
                onClick={() => setSelectedSeason(null)}
                className="mb-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
              >
                Back to Seasons
              </button>
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">{selectedSeason.name}</h2>
              <table className="min-w-full bg-white dark:bg-gray-800">
                <thead>
                  <tr>
                    <th className="py-2 text-gray-700 dark:text-gray-300">Player</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map(player => (
                    <tr key={player.id}>
                      <td className="py-2 text-gray-900 dark:text-gray-100">{player.username}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}