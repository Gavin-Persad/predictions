//src/app/viewseason/components/georgeCup/viewGeorgeCup.tsx

"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../../../../supabaseClient";
import { Layout } from "./viewGeorgeCupLayout";

interface Props {
    seasonId: string;
    onClose: () => void;
}

type RoundState = {
    id: string;
    round_number: number;
    round_name: string;
    game_week_id: string | null;
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

export default function ViewGeorgeCup({ seasonId, onClose }: Props): JSX.Element {
    const [rounds, setRounds] = useState<RoundState[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                // Fetch players
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
                
                // Fetch rounds and fixtures
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
                
                setRounds(roundsData.map(round => ({
                    ...round,
                    fixtures: round.george_cup_fixtures || []
                })));
                
            } catch (error) {
                console.error('Error fetching George Cup data:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [seasonId]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    George Cup
                </h2>
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                >
                    Back
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center">
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
                                        className={`${Layout.playerBox.base} ${isEliminated ? Layout.playerBox.eliminated : ''}`}
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
                            <h3 className={Layout.roundTitle}>{round.round_name}</h3>
                            
                            {/* Fixtures */}
                            <div className={Layout.scrollContainer}>
                                <div className="space-y-2">
                                    {round.fixtures.map(fixture => (
                                        <div key={fixture.id} className={Layout.fixtureBox}>
                                            {/* Player 1 */}
                                            <div className={`${Layout.playerBox.base} ${
                                                fixture.winner_id === fixture.player1_id ? Layout.playerBox.winner :
                                                fixture.winner_id && fixture.player1_id ? Layout.playerBox.loser :
                                                !fixture.player1_id ? Layout.playerBox.bye : ''
                                            }`}>
                                                <span>
                                                    {fixture.player1_id ? 
                                                        players.find(p => p.id === fixture.player1_id)?.username : 
                                                        (!fixture.player1_id && !fixture.player2_id) ? 'Undecided' : 'BYE'
                                                    }
                                                </span>
                                            </div>

                                            <div className="text-center text-sm text-gray-500 dark:text-gray-400 my-1">vs</div>

                                            {/* Player 2 */}
                                            <div className={`${Layout.playerBox.base} ${
                                                fixture.winner_id === fixture.player2_id ? Layout.playerBox.winner :
                                                fixture.winner_id && fixture.player2_id ? Layout.playerBox.loser :
                                                !fixture.player2_id ? Layout.playerBox.bye : ''
                                            }`}>
                                                <span>
                                                    {fixture.player2_id ? 
                                                        players.find(p => p.id === fixture.player2_id)?.username : 
                                                        (!fixture.player1_id && !fixture.player2_id) ? 'Undecided' : 'BYE'
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}