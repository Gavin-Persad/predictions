//src/app/viewseason/components/laveryCup/editLaveryCup.tsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../../../supabaseClient";
import { format } from "date-fns";
import { v4 as uuidv4 } from 'uuid';

interface Props {
    seasonId: string;
    onClose: () => void;
}

type Player = {
    id: string;
    username: string;
};

type GameWeek = {
    id: string;
    week_number: number;
    season_id: string;
    live_start: string;
    is_locked: boolean;
    deadline: string;
};

type LaveryCupRound = {
    id: string;
    season_id: string;
    round_number: number;
    round_name: string;
    game_week_id: string | null;
    is_complete: boolean;
    created_at: string;
};

type PlayerSelection = {
    id: string;
    round_id: string;
    player_id: string;
    team1_name: string;
    team2_name: string;
    team1_won: boolean | null;
    team2_won: boolean | null;
    advanced: boolean;
    created_at: string;
    player_username?: string;
};


export default function EditLaveryCup({ seasonId, onClose }: Props): JSX.Element {
    const [loading, setLoading] = useState(true);
    const [players, setPlayers] = useState<Player[]>([]);
    const [gameWeeks, setGameWeeks] = useState<GameWeek[]>([]);
    const [rounds, setRounds] = useState<LaveryCupRound[]>([]);
    const [selections, setSelections] = useState<PlayerSelection[]>([]);
    const [selectedGameWeekId, setSelectedGameWeekId] = useState<string | null>(null);
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetConfirmText, setResetConfirmText] = useState("");
    const [seasonName, setSeasonName] = useState("");
    const [winningTeams, setWinningTeams] = useState<string[]>([]);
    
    useEffect(() => {
        const fetchData = async () => {
            try {

                setLoading(true);
                
                const { data: seasonData, error: seasonError } = await supabase
                    .from('seasons')
                    .select('name')
                    .eq('id', seasonId)
                    .single();
                
                if (seasonError) throw seasonError;
                if (seasonData) {
                    setSeasonName(seasonData.name);
                }
                
                const { data: playersData, error: playersError } = await supabase
                .from('season_players')
                .select(`
                    player_id,
                    profiles!inner (
                        id,
                        username
                    )
                `)
                .eq('season_id', seasonId);
            
            if (playersError) throw playersError;
            if (playersData) {
                const mappedPlayers: Player[] = [];
                for (let i = 0; i < playersData.length; i++) {
                    const item = playersData[i] as unknown as {
                        player_id: string;
                        profiles: {
                            id: string;
                            username: string;
                        }
                    };
                    
                    mappedPlayers.push({
                        id: item.profiles.id,
                        username: item.profiles.username
                    });
                }
                setPlayers(mappedPlayers);
            }

            const { data: gameWeeksData, error: gameWeeksError } = await supabase
                    .from('game_weeks')
                    .select('*')
                    .eq('season_id', seasonId)
                    .order('week_number', { ascending: true });
                
                if (gameWeeksError) throw gameWeeksError;
                if (gameWeeksData) {
                    setGameWeeks(gameWeeksData);
                }
                
                const { data: roundsData, error: roundsError } = await supabase
                    .from('lavery_cup_rounds')
                    .select('*')
                    .eq('season_id', seasonId)
                    .order('round_number', { ascending: true });
                
                if (roundsError) throw roundsError;
                if (roundsData) {
                    setRounds(roundsData);
                    
                    if (roundsData.length > 0) {
                        const allSelectionsPromises = roundsData.map(round => 
                            supabase
                                .from('lavery_cup_selections')
                                .select(`
                                    *,
                                    profiles:player_id (username)
                                `)
                                .eq('round_id', round.id)
                        );
                        
                        const selectionsResults = await Promise.all(allSelectionsPromises);
                        
                        const allSelections = selectionsResults.flatMap((result, index) => {
                            if (result.error) {
                                console.error(`Error fetching selections for round ${roundsData[index].id}:`, result.error);
                                return [];
                            }
                            return (result.data || []).map(selection => ({
                                ...selection,
                                player_username: selection.profiles?.username
                            }));
                        });
                        
                        setSelections(allSelections);
                    }
                }
                
            } catch (error) {
                console.error('Error fetching Lavery Cup data:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [seasonId]);
    
    const createNewRound = async () => {
        if (!selectedGameWeekId) return;
        
        try {
            const roundNumber = rounds.length ? Math.max(...rounds.map(r => r.round_number)) + 1 : 1;
            const roundName = `Round ${roundNumber}`;

            const newRoundId = uuidv4();
            
            const { data: newRound, error } = await supabase
                .from('lavery_cup_rounds')
                .insert([{
                    id: newRoundId,
                    season_id: seasonId,
                    round_number: roundNumber,
                    round_name: roundName,
                    game_week_id: selectedGameWeekId,
                    is_complete: false
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            setRounds([...rounds, newRound]);
            setSelectedGameWeekId(null);
            
        } catch (error) {
            console.error('Error creating new round:', error);
        }
    };
    
    const handleMarkWinningTeams = async (roundId: string) => {
        try {
            const round = rounds.find(r => r.id === roundId);
            if (!round) return;
            
            const allRoundSelections = selections.filter(s => s.round_id === roundId);
            const roundSelections = allRoundSelections.filter(s => 
                isPlayerEligible(s.player_id, round.round_number)
            );
            
            const updatedPromises = roundSelections.map(selection => {
                const team1Won = winningTeams.includes(selection.team1_name);
                const team2Won = winningTeams.includes(selection.team2_name);
                const advanced = team1Won && team2Won;
                
                return supabase
                    .from('lavery_cup_selections')
                    .update({
                        team1_won: team1Won,
                        team2_won: team2Won,
                        advanced
                    })
                    .eq('id', selection.id);
            });
            
            await Promise.all(updatedPromises);
            
            await supabase
                .from('lavery_cup_rounds')
                .update({ is_complete: true })
                .eq('id', roundId);
            
            const { data: updatedSelections } = await supabase
                .from('lavery_cup_selections')
                .select(`
                    *,
                    profiles:player_id (username)
                `)
                .eq('round_id', roundId);
                
            const { data: updatedRounds } = await supabase
                .from('lavery_cup_rounds')
                .select('*')
                .eq('id', roundId);
            
            if (updatedSelections && updatedRounds) {
                setSelections(selections.map(s => 
                    s.round_id === roundId ? 
                    {
                        ...updatedSelections.find(us => us.id === s.id)!,
                        player_username: s.player_username
                    } : s
                ));
                
                setRounds(rounds.map(r => 
                    r.id === roundId ? updatedRounds[0] : r
                ));
            }
            
            const anyonePassed = updatedSelections?.some(s => s.advanced);
            if (!anyonePassed) {
                setShowResetModal(true);
            }
            
            setWinningTeams([]);
            
        } catch (error) {
            console.error('Error marking winning teams:', error);
        }
    };
    
    const handleResetTournament = async () => {
        if (resetConfirmText !== "RESET") return;
        
        try {
            await supabase
                .from('lavery_cup_selections')
                .delete()
                .in('round_id', rounds.map(r => r.id));
            
            await supabase
                .from('lavery_cup_rounds')
                .delete()
                .eq('season_id', seasonId);
            
            await supabase
                .from('player_used_teams')
                .delete()
                .eq('season_id', seasonId);
            
            setRounds([]);
            setSelections([]);
            setShowResetModal(false);
            setResetConfirmText("");
            
        } catch (error) {
            console.error('Error resetting tournament:', error);
        }
    };
    
    const toggleWinningTeam = (teamName: string) => {
        setWinningTeams(prev => 
            prev.includes(teamName) ? 
                prev.filter(t => t !== teamName) : 
                [...prev, teamName]
        );
    };
    
    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        try {
            return format(new Date(dateString), 'dd/MM/yy HH:mm');
        } catch (e) {
            return '';
        }
    };

    const isPlayerEligible = (playerId: string, roundNumber: number) => {
        if (roundNumber === 1) return true;
        
        const previousRounds = rounds
            .filter(r => r.round_number < roundNumber && r.is_complete);
        
        for (const prevRound of previousRounds) {
            const playerSelections = selections.filter(s => 
                s.round_id === prevRound.id && 
                s.player_id === playerId
            );
            
            if ((playerSelections.length > 0 && !playerSelections[0].advanced) || 
                (playerSelections.length === 0)) {
                return false;
            }
        }
        
        return true;
    };

    const canSelectGameWeek = (gameWeek: GameWeek) => {
        const isUsedInRound = rounds.some(round => round.game_week_id === gameWeek.id);
        const now = new Date();
        const liveStart = new Date(gameWeek.live_start);
        return !isUsedInRound && liveStart > now;
    };

    const determineWinner = useCallback(() => {
        if (!rounds.length) return null;
        
        // Find all players who have advanced through all rounds (still active)
        let advancedPlayers = new Set<string>();
        
        // Initialize with all players
        players.forEach(player => advancedPlayers.add(player.id));
        
        // Remove players who didn't advance in any completed round
        rounds.forEach(round => {
            if (round.is_complete) {
                const roundSelections = selections.filter(s => s.round_id === round.id);
                const advancedInRound = new Set(
                    roundSelections
                        .filter(s => s.advanced)
                        .map(s => s.player_id)
                );
                
                // Keep only players who explicitly advanced in this round
                const newAdvancedPlayers = new Set<string>();
                
                advancedInRound.forEach(playerId => {
                    newAdvancedPlayers.add(playerId);
                });
                
                // Replace our working set with only the players who advanced
                advancedPlayers = newAdvancedPlayers;
            }
        });
        
        // If we have exactly one winner and all rounds are complete
        if (advancedPlayers.size === 1 && rounds.every(r => r.is_complete)) {
            const winnerId = Array.from(advancedPlayers)[0];
            return players.find(p => p.id === winnerId) || null;
        }
        
        return null;
    }, [rounds, players, selections]);
    
    const winner = determineWinner();

    return (
        <div className="flex flex-col h-full">
            <div className="flex flex-col mb-6">
                <div className="mb-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                    >
                        Back
                    </button>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center">
                    Edit Lavery Cup - {seasonName}
                </h2>
            </div>

            {loading ? (
                <div className="flex justify-center items-center">
                    <p className="text-gray-900 dark:text-gray-100">Loading...</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Create new round section */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">
                            Create New Round
                        </h3>
                        
                        {winner ? (
                            <p className="text-gray-600 dark:text-gray-400 italic text-center">
                                Tournament complete.
                            </p>
                        ) : (
                            <div className="flex items-center space-x-4">
                                <select
                                    className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white flex-grow"
                                    value={selectedGameWeekId || ''}
                                    onChange={(e) => setSelectedGameWeekId(e.target.value || null)}
                                    disabled={winner !== null}
                                >
                                    <option value="">Select a Game Week</option>
                                    {gameWeeks
                                        .filter(gw => canSelectGameWeek(gw))
                                        .map(gw => (
                                            <option key={gw.id} value={gw.id}>
                                                Week {gw.week_number} - Starts {formatDate(gw.live_start)}
                                            </option>
                                        ))
                                    }
                                </select>
                                
                                <button
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                    disabled={!selectedGameWeekId || winner !== null}
                                    onClick={createNewRound}
                                >
                                    Create Round
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* Rounds section */}
                    <div className="space-y-6">
                        {rounds.length === 0 ? (
                            <div className="text-center p-8 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <p className="text-gray-600 dark:text-gray-300">
                                    No rounds created yet. Create a new round to start the Lavery Cup.
                                </p>
                            </div>
                        ) : (
                            rounds.map(round => {
                                const roundSelections = selections.filter(s => s.round_id === round.id);
                                const gameWeek = gameWeeks.find(gw => gw.id === round.game_week_id);
                                
                                return (
                                    <div 
                                        key={round.id} 
                                        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
                                    >
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                {round.round_name} (Round {round.round_number})
                                            </h3>
                                            
                                            {round.is_complete ? (
                                                <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 rounded-full text-sm">
                                                    Complete
                                                </span>
                                            ) : gameWeek && new Date(gameWeek.deadline) < new Date() ? (
                                                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 rounded-full text-sm">
                                                    Ready to Mark
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 rounded-full text-sm">
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                        
                                        {gameWeek && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                                Game Week {gameWeek.week_number} - Deadline: {formatDate(gameWeek.deadline)}
                                            </p>
                                        )}
                                        
                                        {/* Player selections table */}
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full">
                                                <thead>
                                                    <tr className="bg-gray-50 dark:bg-gray-700">
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            Player
                                                        </th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            Team 1
                                                        </th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            Team 2
                                                        </th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                            Status
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                    {roundSelections.length > 0 ? (
                                                        roundSelections.map(selection => (
                                                            <tr key={selection.id}>
                                                                <td className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-gray-100">
                                                                    {selection.player_username}
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap">
                                                                    <div className="flex items-center">
                                                                        {!round.is_complete && gameWeek && new Date(gameWeek.deadline) < new Date() && (
                                                                            <input
                                                                                type="checkbox"
                                                                                className="mr-2"
                                                                                checked={winningTeams.includes(selection.team1_name)}
                                                                                onChange={() => toggleWinningTeam(selection.team1_name)}
                                                                            />
                                                                        )}
                                                                        <span className={selection.team1_won === true ? 'text-green-600 dark:text-green-400 font-bold' : 
                                                                                        selection.team1_won === false ? 'text-red-600 dark:text-red-400 line-through' : 
                                                                                        'text-gray-900 dark:text-gray-100'}>
                                                                            {selection.team1_name}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap">
                                                                    <div className="flex items-center">
                                                                        {!round.is_complete && gameWeek && new Date(gameWeek.deadline) < new Date() && (
                                                                            <input
                                                                                type="checkbox"
                                                                                className="mr-2"
                                                                                checked={winningTeams.includes(selection.team2_name)}
                                                                                onChange={() => toggleWinningTeam(selection.team2_name)}
                                                                            />
                                                                        )}
                                                                        <span className={selection.team2_won === true ? 'text-green-600 dark:text-green-400 font-bold' : 
                                                                                        selection.team2_won === false ? 'text-red-600 dark:text-red-400 line-through' : 
                                                                                        'text-gray-900 dark:text-gray-100'}>
                                                                            {selection.team2_name}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap">
                                                                    {selection.advanced ? (
                                                                        <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 rounded text-xs">
                                                                            Advanced
                                                                        </span>
                                                                    ) : selection.team1_won === null ? (
                                                                        <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100 rounded text-xs">
                                                                            Pending
                                                                        </span>
                                                                    ) : (
                                                                        <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100 rounded text-xs">
                                                                            Eliminated
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={4} className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">
                                                                No selections made yet for this round.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                        
                                        {!round.is_complete && gameWeek && new Date(gameWeek.deadline) < new Date() && roundSelections.length > 0 && (
                                            <div className="mt-4 flex justify-end">
                                                <button
                                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                                    onClick={() => handleMarkWinningTeams(round.id)}
                                                >
                                                    Save Results
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                    {/* Winner section */}
                    {winner && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-2 border-yellow-400 dark:border-yellow-600">
                            <div className="flex flex-col items-center text-center">
                                <svg className="w-20 h-20 text-yellow-500 mb-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M11 17.9V19H7v2h10v-2h-4v-1.1A8 8 0 0 0 20 10h1V8h-1V4H4v4H3v2h1a8 8 0 0 0 7 7.9zM6 6h12v2H6V6z"/>
                                </svg>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                    Tournament Complete!
                                </h3>
                                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                                    🏆 <span className="text-yellow-600 dark:text-yellow-400">{winner.username}</span> is the champion! 🏆
                                </p>
                            </div>
                        </div>
)}
                </div>
            )}
            
            {/* Reset confirmation modal */}
            {showResetModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full">
                        <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">
                            Reset Lavery Cup Tournament
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 mb-6">
                            No players advanced to the next round. The tournament needs to be reset. This will delete all rounds and selections, allowing players to use all teams again.
                        </p>
                        <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Type &quot;RESET&quot; to confirm
                        </label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                value={resetConfirmText}
                                onChange={(e) => setResetConfirmText(e.target.value)}
                                placeholder="RESET"
                            />
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                onClick={() => {
                                    setShowResetModal(false);
                                    setResetConfirmText("");
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                                disabled={resetConfirmText !== "RESET"}
                                onClick={handleResetTournament}
                            >
                                Reset Tournament
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}