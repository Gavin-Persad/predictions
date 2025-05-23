//src/app/viewseason/components/laveryCup/viewLaveryCup.tsx

"use client";

import React, { useState, useEffect, useCallback } from "react"; 
import { supabase } from "../../../../../supabaseClient";
import { Layout } from "./viewLaveryCupLayout";
import { format } from "date-fns";

interface Props {
    seasonId: string;
    onClose: () => void;
}

type Round = {
    id: string;
    round_number: number;
    round_name: string;
    game_week_id: string | null;
    game_week_start_date?: string | null;
    is_complete: boolean;
    season_id: string;
};

type Player = {
    id: string;
    username: string;
};

type Selection = {
    id: string;
    round_id: string;
    player_id: string;
    team1_name: string;
    team2_name: string;
    team1_won: boolean | null;
    team2_won: boolean | null;
    advanced: boolean;
    player_username?: string;
};

export default function ViewLaveryCup({ seasonId, onClose }: Props): JSX.Element {
    const [rounds, setRounds] = useState<Round[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [selections, setSelections] = useState<Record<string, Selection[]>>({});
    const [seasonName, setSeasonName] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        const getCurrentUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUserId(user.id);
        };
        
        getCurrentUser();
    }, []);

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
                setSeasonName(seasonData.name);
                
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
                
                // Get rounds
                const { data: roundsData, error: roundsError } = await supabase
                    .from('lavery_cup_rounds')
                    .select('*')
                    .eq('season_id', seasonId)
                    .order('round_number', { ascending: true });
                
                if (roundsError) throw roundsError;
                
                // Get game weeks data for dates
                const gameWeekIds = roundsData
                    .filter(round => round.game_week_id)
                    .map(round => round.game_week_id);
                
                let gameWeeks: Record<string, any> = {};
                
                if (gameWeekIds.length > 0) {
                    const { data: gameWeeksData, error: gameWeeksError } = await supabase
                        .from('game_weeks')
                        .select('id, live_start')
                        .in('id', gameWeekIds as string[]);
                    
                    if (gameWeeksError) throw gameWeeksError;
                    
                    gameWeeks = gameWeeksData.reduce((acc, gw) => {
                        acc[gw.id] = gw;
                        return acc;
                    }, {} as Record<string, any>);
                }
                
                const processedRounds = roundsData.map(round => ({
                    ...round,
                    game_week_start_date: round.game_week_id && gameWeeks[round.game_week_id] ? 
                        gameWeeks[round.game_week_id].live_start : null
                }));
                
                setRounds(processedRounds);
                
                const selectionsObj: Record<string, Selection[]> = {};
                
                for (const round of processedRounds) {
                    const { data: selectionsData, error: selectionsError } = await supabase
                        .from('lavery_cup_selections')
                        .select(`
                            *,
                            profiles!lavery_cup_selections_player_id_fkey (
                                username
                            )
                        `)
                        .eq('round_id', round.id);
                    
                    if (selectionsError) throw selectionsError;
                    
                    if (selectionsData) {
                        selectionsObj[round.id] = selectionsData.map(s => ({
                            ...s,
                            player_username: s.profiles?.username
                        }));
                    }
                }
                
                setSelections(selectionsObj);
                
            } catch (error) {
                console.error('Error fetching Lavery Cup data:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [seasonId]);

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return '';
        try {
            return format(new Date(dateString), 'dd/MM/yy');
        } catch (e) {
            return '';
        }
    };

    const isRoundLive = (round: Round) => {
        if (!round.game_week_start_date) return false;
        return new Date() >= new Date(round.game_week_start_date);
    };

    const getTeamStatusClass = (isWin: boolean | null) => {
        if (isWin === null) return 'text-gray-900 dark:text-gray-100';
        return isWin ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400 line-through';
    };
    
    const isPlayerEliminated = (playerId: string, roundNumber: number) => {
        if (roundNumber === 1) return false;
        
        const previousRounds = rounds.filter(r => r.round_number < roundNumber && r.is_complete);
        
        for (const prevRound of previousRounds) {
            const playerSelections = selections[prevRound.id]?.filter(s => s.player_id === playerId);
            
            if ((playerSelections?.length > 0 && !playerSelections[0].advanced) || 
                (playerSelections?.length === 0)) {
                return true;
            }
        }
        
        return false;
    };

    const isTournamentDeadlocked = useCallback(() => {
        if (!rounds.length) return false;
        
        // Find the most recent completed round
        const completedRounds = rounds.filter(r => r.is_complete);
        if (completedRounds.length === 0) return false;
        
        const latestRound = completedRounds.reduce((latest, round) => 
          !latest || round.round_number > latest.round_number ? round : latest, completedRounds[0]);
        
        // Check if any players advanced in this round
        const roundSelections = selections[latestRound.id] || [];
        return roundSelections.length > 0 && !roundSelections.some(s => s.advanced);
    }, [rounds, selections]);
      

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
                    Lavery Cup - {seasonName}
                </h2>
            </div>
    
            {loading ? (
                <div className="flex justify-center items-center">
                    <p className="text-gray-900 dark:text-gray-100">Loading...</p>
                </div>
            ) : (
                <>
                    {isTournamentDeadlocked() && (
                        <div className="bg-red-50 dark:bg-red-900 border border-red-300 dark:border-red-700 p-4 rounded-lg mb-6">
                            <div className="flex flex-col items-center text-center">
                                <svg className="w-8 h-8 text-red-500 mb-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                                <p className="text-red-700 dark:text-red-400 font-medium">
                                    All players have been eliminated in the latest round!
                                </p>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    Tournament reset coming soon.
                                </p>
                            </div>
                        </div>
                    )}
                    <div className={Layout.container}>
                        {/* Players Column */}
                    <div className={Layout.column}>
                        <h3 className={Layout.roundTitle}>Players</h3>
                        <div className={Layout.scrollContainer}>
                        {players.map(player => {
                            const isEliminated = rounds.length > 0 ? 
                                isPlayerEliminated(player.id, rounds[rounds.length - 1].round_number + 1) : false;
                            
                            return (
                                <div 
                                    key={player.id} 
                                    className={`${Layout.playerBox.base} ${
                                        isEliminated ? Layout.playerBox.eliminated : ''
                                    } ${player.id === currentUserId ? Layout.playerBox.currentUser : ''}`}
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
                                    {/* For each player, show their selections if they have any */}
                                    {players.map(player => {
                                        const playerSelection = selections[round.id]?.find(
                                            s => s.player_id === player.id
                                        );
                                        
                                        const showSelections = isRoundLive(round);
                                        const isHighlighted = player.id === currentUserId;
                                        
                                        // Skip players eliminated before this round
                                        if (isPlayerEliminated(player.id, round.round_number)) {
                                            return null;
                                        }
                                        
                                        return (
                                            <div key={`${round.id}-${player.id}`} className={`${Layout.selectionBox} ${
                                                isHighlighted ? Layout.selectionBox.currentUser : ''
                                            }`}>
                                                <div className="font-medium mb-1 text-gray-900 dark:text-gray-100">{player.username}</div>
                                                
                                                {playerSelection ? (
                                                    showSelections ? (
                                                        <div className="flex flex-col">
                                                            <div className={`${getTeamStatusClass(playerSelection.team1_won)}`}>
                                                                {playerSelection.team1_name}
                                                            </div>
                                                            <div className={`${getTeamStatusClass(playerSelection.team2_won)}`}>
                                                                {playerSelection.team2_name}
                                                            </div>
                                                            <div className="mt-1 text-xs">
                                                                {round.is_complete ? (
                                                                    playerSelection.advanced ? (
                                                                        <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 rounded">
                                                                            Advanced
                                                                        </span>
                                                                    ) : (
                                                                        <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 rounded">
                                                                            Eliminated
                                                                        </span>
                                                                    )
                                                                ) : (
                                                                    <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100 rounded">
                                                                        Pending
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                                                            Selections hidden until {formatDate(round.game_week_start_date)}
                                                        </div>
                                                    )
                                                ) : (
                                                    <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                                                        No selections made
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Winner Column - only show if final round has a winner */}
                        {(() => {
        // Find the final round
        const finalRound = rounds.length > 0 ? rounds[rounds.length - 1] : null;
        if (!finalRound) return null;
        
        // Find all players who have advanced through all rounds (still active)
        let advancedPlayers = new Set<string>();
        
        // Initialize with all players
        players.forEach(player => advancedPlayers.add(player.id));
        
        // Remove players who didn't advance in any completed round
        rounds.forEach(round => {
            if (round.is_complete) {
                const roundSelections = selections[round.id] || [];
                const advancedInRound = new Set(
                    roundSelections
                        .filter(s => s.advanced)
                        .map(s => s.player_id)
                );
                
                // Keep only players who explicitly advanced in this round
                // This is the key change - we're completely rebuilding the set for each round
                const newAdvancedPlayers = new Set<string>();
                
                // Only add players who actually advanced
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
            const winner = players.find(p => p.id === winnerId);
            
            if (!winner) return null;
            
            return (
                <div className={`${Layout.column} ${Layout.winnerColumn}`}>
                    <h3 className={Layout.roundTitle}>Winner</h3>
                    <div className={Layout.scrollContainer}>
                        <div className="flex flex-col items-center justify-center h-full text-center p-4">
                            <svg className="w-24 h-24 text-yellow-500 mb-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11 17.9V19H7v2h10v-2h-4v-1.1A8 8 0 0 0 20 10h1V8h-1V4H4v4H3v2h1a8 8 0 0 0 7 7.9zM6 6h12v2H6V6z"/>
                            </svg>
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                {winner.username}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Lavery Cup Champion
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                {seasonName}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        // If we have multiple winners and the final round is complete, show "Next round coming soon"
        else if (advancedPlayers.size > 1 && finalRound.is_complete) {
            return (
                <div className={`${Layout.column} ${Layout.winnerColumn}`}>
                    <h3 className={Layout.roundTitle}>Next Steps</h3>
                    <div className={Layout.scrollContainer}>
                        <div className="flex flex-col items-center justify-center h-full text-center p-4">
                            <svg className="w-24 h-24 text-blue-500 mb-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.618 5.968l1.453-1.453 1.414 1.414-1.453 1.453a9 9 0 1 1-1.414-1.414zM12 20a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm0-12v5l4 2-1 2-5-3V8z"/>
                            </svg>
                            <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                Next round coming soon...
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                {advancedPlayers.size} players remaining
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        
        return null;
    })()}

                </div>
            </>
        )}
    </div>
);
}