//src/app/viewseason/page.tsx

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../supabaseClient';
import Sidebar from '../../components/Sidebar';
import DarkModeToggle from '../../components/darkModeToggle';
import ViewGameWeeks from './components/ViewGameWeeks';
import EditPlayers from './components/EditPlayers';
import GameWeekOptions from './components/GameWeekOptions';
import LeagueTable from './components/leagueTable';
import ViewGeorgeCup from './components/georgeCup/viewGeorgeCup';
import EditGeorgeCup from './components/georgeCup/EditGeorgeCup';
import ViewLaveryCup from './components/laveryCup/viewLaveryCup';
import EditLaveryCup from './components/laveryCup/editLaveryCup';

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

type Player = {
    id: string;
    username: string;
    club?: string;
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
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [showLeagueTable, setShowLeagueTable] = useState(false);
    const [showGeorgeCup, setShowGeorgeCup] = useState(false);
    const [showLaveryCup, setShowLaveryCup] = useState(false);
    const [editGeorgeCup, setEditGeorgeCup] = useState(false);
    const [editLaveryCup, setEditLaveryCup] = useState(false);
    const [loadingSeasons, setLoadingSeasons] = useState(true);


    const fetchPlayers = async (seasonId: string) => {
        try {
            const { data, error } = await supabase
                .from('season_players')
                .select(`
                    profiles (
                        id,
                        username,
                        club
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
                    club?: string;
                };
            }>).map(sp => ({
                id: sp.profiles.id,
                username: sp.profiles.username,
                club: sp.profiles.club
            }));

            setPlayers(formattedPlayers);
        } catch (error) {
            console.error('Error:', error);
            setMessage('Error fetching players');
        }
    };

    useEffect(() => {
        const checkAuthAndFetchData = async () => {
            setLoadingSeasons(true); 
            
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
        
        setLoadingSeasons(false);
    };

        checkAuthAndFetchData();

    }, [router]);

    const handleDeleteSeason = async () => {
        if (deleteConfirmText !== 'DELETE') return;
        
        setIsDeleting(true);
        try {
            // 1. First get all game weeks for this season (needed for cascading deletes)
            const { data: gameWeekIds, error: gameWeekError } = await supabase
                .from('game_weeks')
                .select('id')
                .eq('season_id', selectedSeason?.id);
    
            if (gameWeekError) throw gameWeekError;
            
            if (gameWeekIds && gameWeekIds.length > 0) {
                const gameWeekIdValues = gameWeekIds.map(gw => gw.id);
                
                // 2. Get fixtures for these game weeks
                const { data: fixtureIds, error: fixtureError } = await supabase
                    .from('fixtures')
                    .select('id')
                    .in('game_week_id', gameWeekIdValues);
    
                if (fixtureError) throw fixtureError;
                
                // 3. Delete predictions for these fixtures
                if (fixtureIds && fixtureIds.length > 0) {
                    const { error: predictionsError } = await supabase
                        .from('predictions')
                        .delete()
                        .in('fixture_id', fixtureIds.map(f => f.id));
    
                    if (predictionsError) throw predictionsError;
                }
                
                // 4. Delete game week scores
                const { error: gameWeekScoresError } = await supabase
                    .from('game_week_scores')
                    .delete()
                    .in('game_week_id', gameWeekIdValues);
    
                if (gameWeekScoresError) throw gameWeekScoresError;
                
                // 5. Delete fixtures
                const { error: fixturesError } = await supabase
                    .from('fixtures')
                    .delete()
                    .in('game_week_id', gameWeekIdValues);
    
                if (fixturesError) throw fixturesError;
            }
            
            // 6. Get and delete George Cup data
            // 6a. First get rounds for this season
            const { data: georgeCupRounds, error: georgeCupRoundsError } = await supabase
                .from('george_cup_rounds')
                .select('id')
                .eq('season_id', selectedSeason?.id);
                
            if (georgeCupRoundsError) throw georgeCupRoundsError;
            
            if (georgeCupRounds && georgeCupRounds.length > 0) {
                // 6b. Delete fixtures for these rounds
                const { error: georgeCupFixturesError } = await supabase
                    .from('george_cup_fixtures')
                    .delete()
                    .in('round_id', georgeCupRounds.map(r => r.id));
                    
                if (georgeCupFixturesError) throw georgeCupFixturesError;
                
                // 6c. Delete the rounds themselves
                const { error: georgeCupRoundsDeleteError } = await supabase
                    .from('george_cup_rounds')
                    .delete()
                    .eq('season_id', selectedSeason?.id);
                    
                if (georgeCupRoundsDeleteError) throw georgeCupRoundsDeleteError;
            }
            
            // 7. Get and delete Lavery Cup data
            // 7a. First get rounds for this season
            const { data: laveryCupRounds, error: laveryCupRoundsError } = await supabase
                .from('lavery_cup_rounds')
                .select('id')
                .eq('season_id', selectedSeason?.id);
                
            if (laveryCupRoundsError) throw laveryCupRoundsError;
            
            if (laveryCupRounds && laveryCupRounds.length > 0) {
                // 7b. Delete selections for these rounds
                const { error: laveryCupSelectionsError } = await supabase
                    .from('lavery_cup_selections')
                    .delete()
                    .in('round_id', laveryCupRounds.map(r => r.id));
                    
                if (laveryCupSelectionsError) throw laveryCupSelectionsError;
                
                // 7c. Delete the rounds themselves
                const { error: laveryCupRoundsDeleteError } = await supabase
                    .from('lavery_cup_rounds')
                    .delete()
                    .eq('season_id', selectedSeason?.id);
                    
                if (laveryCupRoundsDeleteError) throw laveryCupRoundsDeleteError;
            }
            
            // 8. Delete player used teams
            const { error: usedTeamsError } = await supabase
                .from('player_used_teams')
                .delete()
                .eq('season_id', selectedSeason?.id);
                
            if (usedTeamsError) throw usedTeamsError;
            
            // 9. Delete season scores
            const { error: seasonScoresError } = await supabase
                .from('season_scores')
                .delete()
                .eq('season_id', selectedSeason?.id);
                
            if (seasonScoresError) throw seasonScoresError;
            
            // 10. Delete game weeks
            const { error: gameWeeksError } = await supabase
                .from('game_weeks')
                .delete()
                .eq('season_id', selectedSeason?.id);
    
            if (gameWeeksError) throw gameWeeksError;
    
            // 11. Delete season players
            const { error: playersError } = await supabase
                .from('season_players')
                .delete()
                .eq('season_id', selectedSeason?.id);
    
            if (playersError) throw playersError;
    
            // 12. Finally delete the season
            const { error: seasonError } = await supabase
                .from('seasons')
                .delete()
                .eq('id', selectedSeason?.id);
    
            if (seasonError) throw seasonError;
    
            // Refresh the seasons list
            const { data: refreshedSeasons } = await supabase
                .from('seasons')
                .select('id, name, start_date, end_date');
                
            if (refreshedSeasons) {
                setSeasons(refreshedSeasons);
            }
    
            handleBackToSeasonClick();
            
        } catch (error) {
            console.error('Error deleting season:', error);
            setMessage('Failed to delete season. See console for details.');
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirmation(false);
            setDeleteConfirmText('');
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
        setViewPlayers(false);
        setEditPlayers(false);
    };

    const handleEditGameWeekClick = () => {
        setGameWeekOptionView(true);
    };

    if (showLeagueTable && selectedSeason) {
        return <LeagueTable 
            seasonId={selectedSeason.id} 
            onClose={() => setShowLeagueTable(false)} 
        />;
    }

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
        
        {loadingSeasons ? (
            <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        ) : (
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
                        )}
                    </>
                    ) :  editPlayers ? (
                        <EditPlayers 
                            seasonId={selectedSeason.id} 
                            onClose={handleCloseEditPlayers} 
                        />
                    ) : viewPlayers ? (
                        <div>
                            <button
                                onClick={() => setViewPlayers(false)}
                                className="mb-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                            >
                                Back
                            </button>
                            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                                {players.length} Players
                            </h2>
                            <div className="space-y-2">
                                {players.map(player => (
                                    <div
                                        key={player.id}
                                        className="p-4 bg-gray-100 dark:bg-gray-700 rounded"
                                    >
                                        <span className="text-gray-900 dark:text-gray-100">
                                            {player.username}
                                            {player.club && (
                                                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                                                    ({player.club})
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : viewGameWeek ? (
                        <ViewGameWeeks
                            seasonId={selectedSeason.id}
                            onClose={() => setViewGameWeek(false)}
                        />
                    ) : showGeorgeCup ? (
                        <ViewGeorgeCup
                            seasonId={selectedSeason.id}
                            onClose={() => setShowGeorgeCup(false)}
                        />
                    ) : editGeorgeCup ? (
                        <EditGeorgeCup
                            seasonId={selectedSeason.id}
                            onClose={() => setEditGeorgeCup(false)}
                        />
                    ) : showLaveryCup ? (
                        <ViewLaveryCup
                            seasonId={selectedSeason.id}
                            onClose={() => setShowLaveryCup(false)}
                        />
                    ) : editLaveryCup ? (
                        <EditLaveryCup
                            seasonId={selectedSeason.id}
                            onClose={() => setEditLaveryCup(false)}
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
                            
                            {/* Add season title here */}
                            <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
                                {selectedSeason.name}
                            </h1>
                            
                            <div className="w-full flex flex-col items-center">
                                <div className="grid grid-cols-3 gap-4 w-full max-w-3xl">

                                <div className="flex flex-col gap-4">
                                    <button
                                        onClick={handleViewPlayersClick}
                                        className="px-4 py-2 w-full text-sm sm:text-base bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300"
                                    >
                                        View Players
                                    </button>
                                    <button
                                        onClick={handleViewGameWeekClick}
                                        className="px-4 py-2 w-full text-sm sm:text-base bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300"
                                    >
                                        View Game Week
                                    </button>
                                    <button
                                        onClick={() => setShowLeagueTable(true)}
                                        className="px-4 py-2 w-full text-sm sm:text-base bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300"
                                    >
                                        League Table
                                    </button>
                                    <button
                                        onClick={() => setShowGeorgeCup(true)}
                                        className="px-4 py-2 w-full text-sm sm:text-base bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300"
                                    >
                                        George Cup
                                    </button>
                                    <button
                                        onClick={() => setShowLaveryCup(true)}
                                        className="px-4 py-2 w-full text-sm sm:text-base bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300"
                                    >
                                        Lavery Cup
                                    </button>
                                </div>

                                {profile?.is_host && (
                                    <div className="flex flex-col gap-4">
                                        <button
                                            onClick={handleEditPlayersClick}
                                            className="px-4 py-2 w-full text-sm sm:text-base bg-green-600 text-white rounded hover:bg-green-700 transition duration-300"
                                        >
                                            Edit Players
                                        </button>
                                        <button
                                            onClick={handleEditGameWeekClick}
                                            className="px-4 py-2 w-full text-sm sm:text-base bg-green-600 text-white rounded hover:bg-green-700 transition duration-300"
                                        >
                                            Create / Edit Week
                                        </button>

                                        <div className="h-3"></div>
                                        <div className="h-3"></div>
                                        <button
                                            onClick={() => setEditGeorgeCup(true)}
                                            className="px-4 py-2 w-full text-sm sm:text-base bg-green-600 text-white rounded hover:bg-green-700 transition duration-300"
                                        >
                                            Edit George Cup
                                        </button>
                                        <button
                                            onClick={() => setEditLaveryCup(true)}
                                            className="px-4 py-2 w-full text-sm sm:text-base bg-green-600 text-white rounded hover:bg-green-700 transition duration-300"
                                        >
                                            Edit Lavery Cup
                                        </button>
                                    </div>
                                )}

                                    {profile?.is_host && (
                                        <div className="flex flex-col">
                                            <button
                                                onClick={() => setShowDeleteConfirmation(true)}
                                                className="px-4 py-2 w-full text-sm sm:text-base bg-red-600 text-white rounded hover:bg-red-700 transition duration-300"
                                            >
                                                Delete Season
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showDeleteConfirmation && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
                        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                            Delete Season
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-6">
                            This will permanently delete this season and all its related data. Type DELETE to confirm.
                        </p>
                        <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            className="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Type DELETE to confirm"
                        />
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => {
                                    setShowDeleteConfirmation(false);
                                    setDeleteConfirmText('');
                                }}
                                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition duration-300"
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteSeason}
                                className={`px-4 py-2 text-white rounded transition duration-300 ${
                                    deleteConfirmText === 'DELETE'
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-gray-400 cursor-not-allowed'
                                }`}
                                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete Season'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}