// src/app/viewseason/components/georgeCup/viewGeorgeCup.tsx

"use client";

import React, { useState, useEffect, useCallback } from "react"; 
import { supabase } from "../../../../../supabaseClient";
import { Layout } from "./viewGeorgeCupLayout";
import { format } from 'date-fns';

interface Props {
    seasonId: string;
    onClose: () => void;
}

type RoundState = {
    id: string;
    round_number: number;
    round_name: string;
    game_week_id: string | null;
    game_week_start_date?: string;
    is_complete: boolean;
    total_fixtures: number;
    fixtures: FixtureState[];
};

type FixtureState = {
    id: string;
    player1_id: string | null;
    player2_id: string | null;
    winner_id: string | null;
    fixture_number: number;
};

type Player = {
    id: string;
    username: string;
};

type FixtureScores = Record<string, { 
    player1_score?: number;
    player1_correct_scores?: number;
    player2_score?: number;
    player2_correct_scores?: number;
}>;

export default function ViewGeorgeCup({ seasonId, onClose }: Props): JSX.Element {
    const [rounds, setRounds] = useState<RoundState[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [fixtureScores, setFixtureScores] = useState<FixtureScores>({});
    const [seasonName, setSeasonName] = useState<string>("");
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        const getCurrentUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUserId(user.id);
        };
        
        getCurrentUser();
    }, []);


    const fetchFixtureScores = useCallback(async (rounds: RoundState[]): Promise<void> => {
        const scores: FixtureScores = {};
        
        const roundsWithGameWeeks = rounds.filter(round => round.game_week_id);
        if (!roundsWithGameWeeks.length) return;

        try {
            // Get season name
            const { data: seasonData, error: seasonError } = await supabase
                .from('seasons')
                .select('name')
                .eq('id', seasonId)
                .single();
    
            if (seasonError) throw seasonError;
            setSeasonName(seasonData.name);
            
            // Process each round with a game week
            for (const round of roundsWithGameWeeks) {
                if (!round.game_week_id || !round.fixtures.length) continue;
                
                // Get scores for this game week
                const { data: gameWeekScores } = await supabase
                    .from('game_week_scores')
                    .select('player_id, points, correct_scores')
                    .eq('game_week_id', round.game_week_id);
                
                if (!gameWeekScores) continue;
                
                // Process scores for each fixture
                round.fixtures.forEach(fixture => {
                    if (!fixture.player1_id && !fixture.player2_id) return;
                    
                    scores[fixture.id] = {
                        player1_score: gameWeekScores.find(s => s.player_id === fixture.player1_id)?.points,
                        player1_correct_scores: gameWeekScores.find(s => s.player_id === fixture.player1_id)?.correct_scores,
                        player2_score: gameWeekScores.find(s => s.player_id === fixture.player2_id)?.points,
                        player2_correct_scores: gameWeekScores.find(s => s.player_id === fixture.player2_id)?.correct_scores
                    };
                });
            }
            
            setFixtureScores(scores);

        } catch (error) {
            console.error('Error checking game week scores:', error);
        }

    }, [seasonId]);

    // Main data fetching effect
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                // 1. Fetch players
                const { data: playersData, error: playersError } = await supabase
                    .from('season_players')
                    .select(`
                        profiles (
                            id,
                            username
                        )
                    `)
                    .eq('season_id', seasonId);
        
                if (playersError) throw playersError;
                
                const mappedPlayers = (playersData as any).map((p: any) => ({
                    id: p.profiles.id,
                    username: p.profiles.username
                }));
                setPlayers(mappedPlayers);
                
                // 2. Fetch rounds with fixtures
                const { data: roundsData, error: roundsError } = await supabase
                    .from('george_cup_rounds')
                    .select(`
                        *,
                        george_cup_fixtures!george_cup_fixtures_round_id_fkey (
                            id,
                            round_id,
                            fixture_number,
                            player1_id,
                            player2_id,
                            winner_id
                        )
                    `)
                    .eq('season_id', seasonId)
                    .order('round_number', { ascending: true });
        
                if (roundsError) throw roundsError;
                
                // 3. Fetch game weeks for dates
                const gameWeekIds = roundsData
                    .map(round => round.game_week_id)
                    .filter(id => id !== null);
                
                // Create lookup object for game weeks
                let gameWeeks: Record<string, any> = {};
                
                if (gameWeekIds.length > 0) {
                    const { data: gameWeeksData, error: gameWeeksError } = await supabase
                        .from('game_weeks')
                        .select('id, live_start')
                        .in('id', gameWeekIds);
                        
                    if (gameWeeksError) throw gameWeeksError;
                    
                    // Create lookup object
                    gameWeeks = (gameWeeksData || []).reduce((acc, gw) => {
                        acc[gw.id] = gw;
                        return acc;
                    }, {} as Record<string, any>);
                }
                
                // Process rounds with game week dates
                const processedRounds = roundsData.map(round => ({
                    ...round,
                    game_week_start_date: round.game_week_id && gameWeeks[round.game_week_id] ? 
                                          gameWeeks[round.game_week_id].live_start : null,
                    fixtures: round.george_cup_fixtures || []
                }));
                
                setRounds(processedRounds);
                
                // Fetch scores for fixtures
                await fetchFixtureScores(processedRounds);
                
            } catch (error) {
                console.error('Error fetching George Cup data:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();

    }, [seasonId, fetchFixtureScores]);

    // Format date function
    const formatDate = (dateString?: string | null) => {
        if (!dateString) return '';
        try {
            return format(new Date(dateString), 'dd/MM/yy');
        } catch (e) {
            return '';
        }
    };

    return (
        <div className="flex flex-col h-screen">
            <div className="flex flex-col p-4 pb-2">
                <div className="mb-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                    >
                        Back
                    </button>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center">
                    George Cup
                </h2>
            </div>

            {loading ? (
                <div className="flex justify-center items-center flex-grow">
                    <p className="text-gray-900 dark:text-gray-100">Loading...</p>
                </div>
            ) : (
                <div className={Layout.container}>
                    {/* Players Column */}
                    <div className={Layout.column}>
                    <h3 className={Layout.roundTitle}>Players</h3>
                    <div className={Layout.scrollContainer}>
                        {players.map(player => {
                                const isEliminated = rounds.some(round => 
                                    round.fixtures.some(fixture => 
                                        (fixture.player1_id === player.id || fixture.player2_id === player.id) &&
                                        fixture.winner_id && fixture.winner_id !== player.id
                                    )
                                );
                                
                                return (
                                    <div 
                                        key={player.id} 
                                        className={`${Layout.playerBox.base} 
                                            ${isEliminated ? Layout.playerBox.eliminated : ''}
                                            ${player.id === currentUserId ? Layout.playerBox.currentUser : ''}`}
                                    >
                                        {player.username}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Round Columns */}
                    {rounds.map(round => (
                        <div key={round.id} className={`${Layout.column} ${
                            round.is_complete ? Layout.pastRound : Layout.activeRound
                        }`}>
                            <h3 className={Layout.roundTitle}>
                                {round.round_name}
                                {round.game_week_start_date && (
                                    <div className="text-sm font-normal text-gray-600 dark:text-gray-400">
                                        Game Week Start: {formatDate(round.game_week_start_date)}
                                    </div>
                                )}
                            </h3>
                            
                            <div className={Layout.scrollContainer}>
                                <div className="space-y-2">
                                    {round.fixtures
                                        .filter(fixture => fixture.player1_id !== null || fixture.player2_id !== null)
                                        .map(fixture => (
                                            <div key={fixture.id} className={Layout.fixtureBox}>
                                                {/* Player 1 */}
                                                <div className={`${Layout.playerBox.base} ${
                                                    fixture.winner_id === fixture.player1_id ? Layout.playerBox.winner :
                                                    fixture.winner_id && fixture.player1_id ? Layout.playerBox.loser :
                                                    !fixture.player1_id ? Layout.playerBox.bye : ''
                                                    } ${fixture.player1_id === currentUserId ? Layout.playerBox.currentUser : ''}`}>
                                                <div className="flex justify-between w-full">
                                                    <span>
                                                        {fixture.player1_id ? 
                                                            players.find(p => p.id === fixture.player1_id)?.username : 
                                                            (!fixture.player1_id && !fixture.player2_id) ? 'Undecided' : 'BYE'
                                                        }
                                                    </span>
                                                    {fixtureScores[fixture.id]?.player1_score !== undefined && (
                                                        <span className={Layout.playerBox.score}>
                                                            <span className="text-lg font-bold">
                                                                {fixtureScores[fixture.id]?.player1_score}
                                                            </span>
                                                            {fixtureScores[fixture.id]?.player1_correct_scores !== undefined && (
                                                                <span className="text-sm ml-1 text-gray-600 dark:text-gray-400">
                                                                    ({fixtureScores[fixture.id]?.player1_correct_scores})
                                                                </span>
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="text-center text-sm text-gray-500 dark:text-gray-400 my-1">vs</div>

                                            {/* Player 2 */}
                                            <div className={`${Layout.playerBox.base} ${
                                                fixture.winner_id === fixture.player2_id ? Layout.playerBox.winner :
                                                fixture.winner_id && fixture.player2_id ? Layout.playerBox.loser :
                                                !fixture.player2_id ? Layout.playerBox.bye : ''
                                                } ${fixture.player2_id === currentUserId ? Layout.playerBox.currentUser : ''}`}>
                                                <div className="flex justify-between w-full">
                                                    <span>
                                                        {fixture.player2_id ? 
                                                            players.find(p => p.id === fixture.player2_id)?.username : 
                                                            (!fixture.player1_id && !fixture.player2_id) ? 'Undecided' : 'BYE'
                                                        }
                                                    </span>
                                                    {fixtureScores[fixture.id]?.player2_score !== undefined && (
                                                        <span className={Layout.playerBox.score}>
                                                            <span className="text-lg font-bold">
                                                                {fixtureScores[fixture.id]?.player2_score}
                                                            </span>
                                                            {fixtureScores[fixture.id]?.player2_correct_scores !== undefined && (
                                                                <span className="text-sm ml-1 text-gray-600 dark:text-gray-400">
                                                                    ({fixtureScores[fixture.id]?.player2_correct_scores})
                                                                </span>
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Winners Column - only show if final round has a winner */}
                    {(() => {
                        // Find the final round
                        const finalRound = rounds.find(r => r.round_name === 'Final');
                        if (!finalRound) return null;
                        
                        // Find the winning fixture and winner
                        const winningFixture = finalRound.fixtures.find(f => f.winner_id);
                        if (!winningFixture) return null;
                        
                        // Find the winner name
                        const winner = players.find(p => p.id === winningFixture.winner_id);
                        if (!winner) return null;
                        
                        return (
                            <div className={`${Layout.column} ${Layout.winnerColumn}`}>
                                <h3 className={Layout.roundTitle}>Winner</h3>
                                <div className={Layout.scrollContainer}>
                                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                        {/* Trophy SVG */}
                                        <svg className="w-24 h-24 text-yellow-500 mb-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M11 17.9V19H7v2h10v-2h-4v-1.1A8 8 0 0 0 20 10h1V8h-1V4H4v4H3v2h1a8 8 0 0 0 7 7.9zM6 6h12v2H6V6z"/>
                                        </svg>
                                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                            {winner.username}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            George Cup Champion
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            {seasonName}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}