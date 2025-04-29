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

  if (!latestRound) {
    return (
      <Link href={`/viewseason?seasonId=${currentSeason.id}&view=lavery_cup`} className="block">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded min-h-[150px] hover:shadow-md transition-all">
          <div className="flex items-center justify-center h-full text-center">
            <p className="text-gray-600 dark:text-gray-300">Lavery Cup coming soon</p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/viewseason?seasonId=${currentSeason.id}&view=lavery_cup`} className="block">
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded min-h-[150px] hover:shadow-md transition-all">
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
            <p className="text-amber-600 dark:text-amber-400">
              {latestRound.is_complete ? 
                "You didn't submit selections for this round" : 
                "Selections needed for this round"}
            </p>
          </div>
        )}
        
        {/* Add the "View full tournament" link */}
        <div className="text-center mt-3">
          <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
            View full tournament →
          </span>
        </div>
      </div>
    </Link>
  );
}