// src/app/viewseason/page.tsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import DarkModeToggle from '../../components/darkModeToggle';
import Sidebar from '../../components/Sidebar';
import EditPlayers from '../../components/EditPlayers';
import GameWeekOptions from '../../components/GameWeekOptions';
import CreateGameWeek from '../../components/CreateGameWeek';
import ViewGameWeeks from '../../components/ViewGameWeeks';
import { Player, SeasonPlayer } from '../../types/players';

type UserProfile = {
  id: string;
  username: string;
  is_host: boolean;
};

type Season = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
};

export default function ViewSeason() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [viewPlayers, setViewPlayers] = useState(false);
  const [editPlayers, setEditPlayers] = useState(false);
  const [viewGameWeek, setViewGameWeek] = useState(false);
  const [editGameWeek, setEditGameWeek] = useState(false);
  const [gameWeekOptionView, setGameWeekOptionView] = useState(false);
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


  const fetchPlayers = async (seasonId: string) => {
    const { data, error } = await supabase
        .from('season_players')
        .select('player_id, profiles!inner(username)')
        .eq('season_id', seasonId);
    if (error) {
        setMessage('Error fetching players for the season');
    } else {
        const typedData = data as unknown as SeasonPlayer[];
        setPlayers(typedData.map(sp => ({
            id: sp.player_id,
            username: sp.profiles.username || 'Unknown'
        })));
    }
};

  const handleSeasonClick = async (season: Season) => {
    setSelectedSeason(season);
    await fetchPlayers(season.id);
    setViewPlayers(false);
    setEditPlayers(false);
  };

  const handleViewPlayersClick = () => {
    setViewPlayers(true);
  };

  const handleBackToSeasonClick = () => {
    setSelectedSeason(null);
    setViewGameWeek(false);
    setViewPlayers(false);
    setEditPlayers(false);
    setGameWeekOptionView(false);
    setEditGameWeek(false);
};

  const handleEditPlayersClick = () => {
    setEditPlayers(true);
  };

  const handleCloseEditPlayers = async () => {
    if (selectedSeason) {
      await fetchPlayers(selectedSeason.id);
    }
    setEditPlayers(false);
  };

  const handleViewGameWeekClick = () => {
    setViewGameWeek(true);
    setEditGameWeek(false);
    setViewPlayers(false);
    setEditPlayers(false);
  };

  const handleEditGameWeekClick = () => {
    setGameWeekOptionView(true);
    setEditGameWeek(false);
    setViewGameWeek(false);
    setViewPlayers(false);
    setEditPlayers(false);
  };

    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
          <Sidebar />
          <div className="absolute top-4 right-4">
              <DarkModeToggle />
          </div>
          <div className="container mx-auto p-4 pl-24 pt-20">
              <div className="max-w-4xl mx-auto">
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
            ) : editPlayers ? (
              <EditPlayers seasonId={selectedSeason.id} onClose={handleCloseEditPlayers} />
          ) : viewGameWeek ? (
              <ViewGameWeeks
                  seasonId={selectedSeason.id}
                  onClose={() => setViewGameWeek(false)}
              />
            ) : viewPlayers ? (
              <div className="space-y-4">
                  <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                      Players
                  </h2>
                  <button
                      onClick={handleBackToSeasonClick}
                      className="mb-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                  >
                      Back to Seasons
                  </button>
                  <div className="bg-white dark:bg-gray-800 p-8 rounded shadow-md">
                      <ul className="space-y-2">
                          {players.map(player => (
                              <li key={player.id} className="p-2 bg-gray-200 dark:bg-gray-700 rounded shadow text-gray-900 dark:text-gray-100">
                                  {player.username}
                              </li>
                          ))}
                      </ul>
                  </div>
              </div>
                    ) : gameWeekOptionView ? (
                      <GameWeekOptions 
                          seasonId={selectedSeason.id} 
                          onClose={() => setGameWeekOptionView(false)} 
                      />
                  ) : editGameWeek ? (
                      <CreateGameWeek 
                          seasonId={selectedSeason.id} 
                          onClose={() => {
                              setEditGameWeek(false);
                              setGameWeekOptionView(true);
                          }} 
                      />
                    ) : (
                      <div>
                          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                              {selectedSeason.name}
                          </h2>
                          <button
                              onClick={handleBackToSeasonClick}
                              className="mb-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                          >
                              Back to Seasons
                          </button>
                          <div className="bg-white dark:bg-gray-800 p-8 rounded shadow-md">
                              <div className="w-full flex flex-col items-center">
                                  <div className="flex space-x-4">
                                      <button
                                          onClick={handleViewPlayersClick}
                                          className="px-6 py-2 w-40 text-base bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300"
                                      >
                                          View Players
                                      </button>
                                      {profile?.is_host && (
                                          <button
                                              onClick={handleEditPlayersClick}
                                              className="px-6 py-2 w-40 text-base bg-green-600 text-white rounded hover:bg-green-700 transition duration-300"
                                          >
                                              Edit Players
                                          </button>
                                      )}
                                  </div>
                                  <div className="flex space-x-4 mt-4">
                                      <button
                                          onClick={handleViewGameWeekClick}
                                          className="px-6 py-2 w-40 text-base bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300"
                                      >
                                          View Game Week
                                      </button>
                                      {profile?.is_host && (
                                          <button
                                              onClick={handleEditGameWeekClick}
                                              className="px-6 py-2 w-40 text-base bg-green-600 text-white rounded hover:bg-green-700 transition duration-300"
                                          >
                                              Create/Edit Week
                                          </button>
                                      )}
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      </div>
  );
}