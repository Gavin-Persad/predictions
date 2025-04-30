//src/app/dashboard/components/LaveryCupTile.tsx

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../../../supabaseClient';
import { format } from 'date-fns';

type LaveryCupRound = {
  id: string;
  round_number: number;
  round_name: string;
  game_week_id: string | null;
  game_week_start_date?: string | null;
  is_complete: boolean;
  season_id: string;
};

type LaveryCupSelection = {
  id: string;
  round_id: string;
  player_id: string;
  team1_name: string;
  team2_name: string;
  team1_won: boolean | null;
  team2_won: boolean | null;
  advanced: boolean;
};

export default function LaveryCupTile() {
  const [currentSeason, setCurrentSeason] = useState<{id: string, name: string} | null>(null);
  const [latestRound, setLatestRound] = useState<LaveryCupRound | null>(null);
  const [userSelection, setUserSelection] = useState<LaveryCupSelection | null>(null);
  const [eliminatedInfo, setEliminatedInfo] = useState<{round: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePlayers, setActivePlayers] = useState<number>(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [winner, setWinner] = useState<{id: string, username: string} | null>(null);
  const [players, setPlayers] = useState<{id: string, username: string}[]>([]);

  useEffect(() => {
    const fetchLaveryCupData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        setCurrentUserId(user.id);

        // Get current season
        const { data: seasons, error: seasonError } = await supabase
          .from('seasons')
          .select('id, name')
          .order('start_date', { ascending: false })
          .limit(1);
          
        if (seasonError || !seasons || seasons.length === 0) {
          console.error('Error fetching current season:', seasonError);
          setLoading(false);
          return;
        }

        const currentSeason = seasons[0];
        setCurrentSeason(currentSeason);

        // Fetch all players
        const { data: playersData, error: playersError } = await supabase
          .from('season_players')
          .select(`
            profiles (
              id,
              username
            )
          `)
          .eq('season_id', currentSeason.id);
      
        if (playersError) throw playersError;
        
        const mappedPlayers = (playersData as any).map((p: any) => ({
          id: p.profiles.id,
          username: p.profiles.username
        }));
        
        setPlayers(mappedPlayers);

        // Get all rounds for this season
        const { data: rounds, error: roundsError } = await supabase
          .from('lavery_cup_rounds')
          .select('*')
          .eq('season_id', currentSeason.id)
          .order('round_number', { ascending: true });

        if (roundsError) {
          console.error('Error fetching Lavery Cup rounds:', roundsError);
          setLoading(false);
          return;
        }

        if (!rounds || rounds.length === 0) {
          // No rounds found
          setLoading(false);
          return;
        }

        // Get game week dates
        const gameWeekIds = rounds
          .filter(round => round.game_week_id)
          .map(round => round.game_week_id);
          
        if (gameWeekIds.length > 0) {
          const { data: gameWeeks } = await supabase
            .from('game_weeks')
            .select('id, live_start')
            .in('id', gameWeekIds as string[]);
            
          if (gameWeeks) {
            const gameWeekMap = gameWeeks.reduce((acc, gw) => {
              acc[gw.id] = gw;
              return acc;
            }, {} as Record<string, any>);
            
            // Add game week start dates to rounds
            rounds.forEach(round => {
              if (round.game_week_id && gameWeekMap[round.game_week_id]) {
                round.game_week_start_date = gameWeekMap[round.game_week_id].live_start;
              }
            });
          }
        }

        // Check for winner (all rounds complete and only one player remaining)
        if (rounds.every(r => r.is_complete) && rounds.length > 0) {
          // Determine the winner
          const winner = await determineWinner(rounds, currentSeason.id);
          if (winner) {
            setWinner(winner);
            setLoading(false);
            return;
          }
        }

        // Find the latest round that is either:
        // 1. Not complete (ongoing)
        // 2. The most recent completed round
        const ongoingRound = rounds.find(r => !r.is_complete);
        const latestRound = ongoingRound || 
          [...rounds].sort((a, b) => b.round_number - a.round_number)[0];
        
        setLatestRound(latestRound);

        // Check if user was eliminated in an earlier round
        const isEliminatedInEarlierRound = await checkIfUserEliminated(user.id, rounds, latestRound);
        
        if (isEliminatedInEarlierRound) {
          const eliminatedRound = isEliminatedInEarlierRound.round;
          setEliminatedInfo({ round: eliminatedRound.round_name });
        }

        // Count active players if user is eliminated
        if (isEliminatedInEarlierRound) {
          // Get all players who are still active
          const { data: activeSelections } = await supabase
            .from('lavery_cup_selections')
            .select('player_id')
            .eq('round_id', latestRound.id)
            .eq('advanced', true);
            
          // Count unique players with active selections
          const uniqueActivePlayers = activeSelections ? 
            [...new Set(activeSelections.map(s => s.player_id))].length : 
            0;
            
          setActivePlayers(uniqueActivePlayers);
        }

        // Get user's selection for this round
        if (latestRound) {
          const { data: selection, error: selectionError } = await supabase
            .from('lavery_cup_selections')
            .select('*')
            .eq('player_id', user.id)
            .eq('round_id', latestRound.id)
            .single();
            
          if (selectionError && selectionError.code !== 'PGRST116') {
            console.error('Error fetching user selection:', selectionError);
          }
          
          if (selection) {
            setUserSelection(selection);
          }
        }

      } catch (error) {
        console.error('Error fetching Lavery Cup data:', error);
      } finally {
        setLoading(false);
      }
    };

    const determineWinner = async (rounds: LaveryCupRound[], seasonId: string) => {
      // Find all players who have advanced through all rounds (still active)
      let advancedPlayers = new Set<string>();
      
      // Get all the players for this season
      const { data: playersData } = await supabase
        .from('season_players')
        .select(`
          profiles (
            id,
            username
          )
        `)
        .eq('season_id', seasonId);
      
      if (!playersData) return null;
      
      // Initialize with all players
      playersData.forEach((p: any) => advancedPlayers.add(p.profiles.id));
      
      // Process each completed round
      for (const round of rounds.filter(r => r.is_complete)) {
        // Get selections for this round
        const { data: roundSelections } = await supabase
          .from('lavery_cup_selections')
          .select('player_id, advanced')
          .eq('round_id', round.id);
          
        if (!roundSelections) continue;
        
        // Create a new set for players who advanced in this round
        const advancedInRound = new Set(
          roundSelections
            .filter(s => s.advanced)
            .map(s => s.player_id)
        );
        
        // Keep only players who explicitly advanced in this round
        const newAdvancedPlayers = new Set<string>();
        
        // Only add players who actually advanced
        advancedInRound.forEach(playerId => {
          if (advancedPlayers.has(playerId)) {
            newAdvancedPlayers.add(playerId);
          }
        });
        
        // Replace our working set with only the players who advanced
        advancedPlayers = newAdvancedPlayers;
      }
      
      // If we have exactly one winner and all rounds are complete
      if (advancedPlayers.size === 1) {
        const winnerId = Array.from(advancedPlayers)[0];
        
        // Find the player name
        const winnerPlayer = playersData.find((p: any) => p.profiles.id === winnerId) as { 
          profiles: { id: string; username: string } 
        } | undefined;
        
        if (winnerPlayer) {
          return {
            id: winnerId,
            username: winnerPlayer.profiles.username
          };
        }
      }
      
      return null;
    };

    const checkIfUserEliminated = async (userId: string, rounds: LaveryCupRound[], latestRound: LaveryCupRound) => {
      // Check completed rounds before the latest round
      const earlierRounds = rounds.filter(r => 
        r.round_number < latestRound.round_number && r.is_complete
      );
      
      for (const round of earlierRounds) {
        const { data } = await supabase
          .from('lavery_cup_selections')
          .select('advanced')
          .eq('player_id', userId)
          .eq('round_id', round.id)
          .single();
          
        // If the user has a selection that didn't advance, they're eliminated
        if (data && data.advanced === false) {
          return { round };
        }
      }
      
      return null;
    };
    
    fetchLaveryCupData();
  }, []);

  const getTeamStatusClass = (isWin: boolean | null) => {
    if (isWin === null) return 'text-gray-900 dark:text-gray-100';
    return isWin ? 'text-green-600 dark:text-green-400 font-medium' : 'text-red-600 dark:text-red-400 line-through';
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'dd/MM/yy');
    } catch (e) {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded min-h-[150px] flex items-center justify-center">
        <div className="animate-pulse text-gray-600 dark:text-gray-400">Loading Lavery Cup...</div>
      </div>
    );
  }

  if (!currentSeason) {
    return (
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded min-h-[150px] flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-300 text-center">No active season found</p>
      </div>
    );
  }

  if (!latestRound && !winner) {
    return (
      <Link href={`/viewseason?seasonId=${currentSeason.id}&view=lavery_cup`} className="block">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded min-h-[150px] hover:shadow-md transition-all">
          <div className="flex items-center justify-center h-full text-center">
            <p className="text-gray-600 dark:text-gray-300">Lavery Cup coming soon</p>
          </div>
          
          <div className="text-center mt-3">
            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              View full tournament →
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/viewseason?seasonId=${currentSeason.id}&view=lavery_cup`} className="block">
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded min-h-[150px] hover:shadow-md transition-all">
        {winner ? (
          <div className="flex flex-col items-center text-center">
            <svg className="w-16 h-16 text-yellow-500 mb-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 17.9V19H7v2h10v-2h-4v-1.1A8 8 0 0 0 20 10h1V8h-1V4H4v4H3v2h1a8 8 0 0 0 7 7.9zM6 6h12v2H6V6z"/>
            </svg>
            <div className="font-medium text-lg mb-1 text-gray-900 dark:text-gray-100">
              {winner.id === currentUserId ? 
                <>You are the <span className="text-yellow-600 dark:text-yellow-400">Champion!</span></> : 
                <><span className="text-yellow-600 dark:text-yellow-400">{winner.username}</span> is the Champion!</>}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Lavery Cup - {currentSeason.name}
            </div>
          </div>
        ) : latestRound && (
          <>
            <h3 className="font-medium text-lg mb-2 text-gray-900 dark:text-gray-100">
              {latestRound.round_name}
              {latestRound.game_week_start_date && (
                <span className="text-xs ml-2 text-gray-600 dark:text-gray-400">
                  {formatDate(latestRound.game_week_start_date)}
                </span>
              )}
            </h3>

            {userSelection ? (
              <div className="space-y-2">
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                  {latestRound.is_complete ? (
                    <>
                      <div className={getTeamStatusClass(userSelection.team1_won)}>
                        {userSelection.team1_name}
                      </div>
                      <div className={getTeamStatusClass(userSelection.team2_won)}>
                        {userSelection.team2_name}
                      </div>
                      <div className="mt-2 text-sm">
                        {userSelection.advanced ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 rounded">
                            Advanced to next round
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 rounded">
                            Eliminated
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-gray-900 dark:text-gray-100">{userSelection.team1_name}</div>
                      <div className="text-gray-900 dark:text-gray-100">{userSelection.team2_name}</div>
                      <div className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                        Waiting for results
                      </div>
                    </>
                  )}
                </div>
                
                {eliminatedInfo && (
                  <div className="text-center text-xs border-t border-gray-200 dark:border-gray-600 mt-3 pt-2 text-gray-600 dark:text-gray-400">
                    You were knocked out in the {eliminatedInfo.round}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[80px] text-center">
                {eliminatedInfo ? (
                  <p className="text-gray-600 dark:text-gray-400">
                    You were knocked out in the {eliminatedInfo.round}. 
                    <br />{activePlayers} {activePlayers === 1 ? 'player' : 'players'} remaining.
                  </p>
                ) : (
                  <p className="text-amber-600 dark:text-amber-400">
                    {latestRound.is_complete ? 
                      "You didn't submit selections for this round" : 
                      "Selections needed for this round"}
                  </p>
                )}
              </div>
            )}
          </>
        )}
        
        <div className="text-center mt-3">
          <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
            View full tournament →
          </span>
        </div>
      </div>
    </Link>
  );
}