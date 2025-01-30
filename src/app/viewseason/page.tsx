//src/app/viewseason/page.tsx

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../supabaseClient';
import { Player } from '../../types/players';
import Sidebar from '../../components/Sidebar';
import DarkModeToggle from '../../components/darkModeToggle';
import ViewGameWeeks from '../../components/ViewGameWeeks';
import EditPlayers from '../../components/EditPlayers';
import GameWeekOptions from '../../components/GameWeekOptions';


type Season = {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
};

type UserProfile = {
    id: string;
    username: string;
    is_host: boolean;
};

export default function ViewSeason() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [message, setMessage] = useState('');
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
    const [viewPlayers, setViewPlayers] = useState(false);
    const [editPlayers, setEditPlayers] = useState(false);
    const [viewGameWeek, setViewGameWeek] = useState(false);
    const [gameWeekOptionView, setGameWeekOptionView] = useState(false);
    const [editGameWeek, setEditGameWeek] = useState(false);

    const fetchPlayers = async (seasonId: string) => {
      try {
        const { data, error } = await supabase
          .from('season_players')
          .select(`
            profiles (
              id,
              username
            )
          `)
          .eq('season_id', seasonId);
    
        if (error) {
          setMessage('Error fetching players');
          return;
        }
    
        const formattedPlayers = ((data as unknown) as Array<{
          profiles: {
            id: string;
            username: string;
          };
        }>).map(sp => ({
          id: sp.profiles.id,
          username: sp.profiles.username
        }));
    
        setPlayers(formattedPlayers);
      } catch (error) {
        console.error('Error:', error);
        setMessage('Error fetching players');
      }
    };

    useEffect(() => {
        const checkAuthAndFetchData = async () => {
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

            const { data: seasonsData, error: seasonsError } = await supabase
                .from('seasons')
                .select('id, name, start_date, end_date');
            
            if (seasonsError) {
                setMessage('Error fetching seasons');
            } else {
                setSeasons(seasonsData);
            }
        };

        checkAuthAndFetchData();
    }, [router]);

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
    };

    return (
        <div className="flex">
            <Sidebar />
            <div className="flex-grow flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="absolute top-4 right-4">
                    <DarkModeToggle />
                </div>
                <div className="bg-white dark:bg-gray-800 p-8 rounded shadow-md w-full max-w-4xl mx-4">
                    {!selectedSeason ? (
                        <>
                            <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
                                Prediction Years
                            </h1>
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
                        </>
                    ) : editPlayers ? (
                        <EditPlayers 
                            seasonId={selectedSeason.id} 
                            onClose={handleCloseEditPlayers} 
                        />
                    ) : viewGameWeek ? (
                        <ViewGameWeeks
                            seasonId={selectedSeason.id}
                            onClose={() => setViewGameWeek(false)}
                        />
                    ) : gameWeekOptionView ? (
                        <GameWeekOptions
                            seasonId={selectedSeason.id}
                            onClose={() => setGameWeekOptionView(false)}
                        />
                    ) : (
                        <div>
                            <button
                                onClick={handleBackToSeasonClick}
                                className="mb-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                            >
                                Back to Seasons
                            </button>
                            <div className="w-full flex flex-col items-center">
                                <div className="flex flex-wrap justify-center gap-4">
                                    <button
                                        onClick={handleViewPlayersClick}
                                        className="px-4 py-2 w-32 sm:w-40 text-sm sm:text-base bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300"
                                    >
                                        View Players
                                    </button>
                                    {profile?.is_host && (
                                        <button
                                            onClick={handleEditPlayersClick}
                                            className="px-4 py-2 w-32 sm:w-40 text-sm sm:text-base bg-green-600 text-white rounded hover:bg-green-700 transition duration-300"
                                        >
                                            Edit Players
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-wrap justify-center gap-4 mt-4">
                                    <button
                                        onClick={handleViewGameWeekClick}
                                        className="px-4 py-2 w-32 sm:w-40 text-sm sm:text-base bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300"
                                    >
                                        View Game Week
                                    </button>
                                    {profile?.is_host && (
                                        <button
                                            onClick={handleEditGameWeekClick}
                                            className="px-4 py-2 w-32 sm:w-40 text-sm sm:text-base bg-green-600 text-white rounded hover:bg-green-700 transition duration-300"
                                        >
                                            Create/Edit Week
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}