//src/app/dashboard/components/GeorgeCupTile.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../../supabaseClient';
import Link from 'next/link';
import { format } from 'date-fns';

type RoundState = {
  id: string;
  round_number: number;
  round_name: string;
  game_week_id: string | null;
  game_week_start_date?: string;
  is_complete: boolean;
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

export default function GeorgeCupTile() {
  const [currentSeason, setCurrentSeason] = useState<{id: string, name: string} | null>(null);
  const [rounds, setRounds] = useState<RoundState[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [fixtureScores, setFixtureScores] = useState<FixtureScores>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [eliminatedInfo, setEliminatedInfo] = useState<{round: string, date: string} | null>(null);
  
  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    
    getCurrentUser();
  }, []);

  // Main data fetching
  useEffect(() => {
    const fetchGeorgeCupData = async () => {
      try {
        setLoading(true);
        
        // First, get the current season
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
        
        // Fetch players for this season
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
        
        // Fetch all rounds for this season
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
          .eq('season_id', currentSeason.id)
          .order('round_number', { ascending: true });
      
        if (roundsError) throw roundsError;
        
        // Get game week dates
        const gameWeekIds = roundsData
          .map(round => round.game_week_id)
          .filter(id => id !== null);
        
        let gameWeeks: Record<string, any> = {};
        
        if (gameWeekIds.length > 0) {
          const { data: gameWeeksData } = await supabase
            .from('game_weeks')
            .select('id, live_start')
            .in('id', gameWeekIds);
            
          if (gameWeeksData) {
            gameWeeks = gameWeeksData.reduce((acc, gw) => {
              acc[gw.id] = gw;
              return acc;
            }, {} as Record<string, any>);
          }
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
        const scores: FixtureScores = {};
        
        // Get scores for each fixture
        for (const round of processedRounds.filter(r => r.game_week_id)) {
          if (!round.game_week_id) continue;
          
          const { data: gameWeekScores } = await supabase
            .from('game_week_scores')
            .select('player_id, points, correct_scores')
            .eq('game_week_id', round.game_week_id);
          
          if (!gameWeekScores) continue;
          
          round.fixtures.forEach((fixture: FixtureState) => {
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
        
        // Determine if current user is eliminated
        if (currentUserId && processedRounds.length > 0) {
          // Find the round where the user was eliminated
          for (let i = 0; i < processedRounds.length; i++) {
            const round = processedRounds[i];
            const userEliminated = round.fixtures.some((fixture: FixtureState) =>
              (fixture.player1_id === currentUserId || fixture.player2_id === currentUserId) &&
              fixture.winner_id && fixture.winner_id !== currentUserId
            );
            
            if (userEliminated) {
              // Find next active round
              const activeRound = processedRounds.find(r => 
                r.round_number > round.round_number && !r.is_complete
              );
              
              if (activeRound) {
                setEliminatedInfo({
                  round: round.round_name,
                  date: activeRound.game_week_start_date ? 
                    format(new Date(activeRound.game_week_start_date), 'dd/MM/yy') : 'TBD'
                });
              }
              break;
            }
          }
        }
        
      } catch (error) {
        console.error('Error fetching George Cup data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGeorgeCupData();
  }, [currentUserId]);
  
  // Determine which round to display - either the most recent active or the final if completed
  const determineDisplayRound = () => {
    if (!rounds.length) return null;
    
    // If we have a final round with a winner, display that
    const finalRound = rounds.find(r => r.round_name === 'Final');
    if (finalRound && finalRound.is_complete && finalRound.fixtures.some(f => f.winner_id)) {
      return finalRound;
    }
    
    // Otherwise, find the most recent active round
    const activeRounds = rounds.filter(r => !r.is_complete);
    if (activeRounds.length > 0) {
      return activeRounds.reduce((latest, round) => 
        latest.round_number > round.round_number ? latest : round, activeRounds[0]
      );
    }
    
    // If all rounds are complete but no final winner (shouldn't happen), show the last round
    return rounds[rounds.length - 1];
  };
  
  // Get the winner if final round is complete
  const getWinner = () => {
    const finalRound = rounds.find(r => r.round_name === 'Final');
    if (!finalRound || !finalRound.is_complete) return null;
    
    const winningFixture = finalRound.fixtures.find((f: FixtureState) => f.winner_id);
    if (!winningFixture) return null;
    
    return players.find(p => p.id === winningFixture.winner_id);
  };
  
  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded min-h-[150px] flex items-center justify-center">
        <div className="animate-pulse text-gray-600 dark:text-gray-400">Loading George Cup...</div>
      </div>
    );
  }
  
  if (!currentSeason || rounds.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded min-h-[150px] flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-300 text-center">No George Cup found</p>
      </div>
    );
  }
  
  const displayRound = determineDisplayRound();
  const winner = getWinner();
  
  return (
    <Link href={`/viewseason?seasonId=${currentSeason.id}&view=george_cup`} className="block">
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded min-h-[150px] hover:shadow-md transition-all">
        {winner ? (
          <div className="flex flex-col items-center text-center">
            <svg className="w-16 h-16 text-yellow-500 mb-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 17.9V19H7v2h10v-2h-4v-1.1A8 8 0 0 0 20 10h1V8h-1V4H4v4H3v2h1a8 8 0 0 0 7 7.9zM6 6h12v2H6V6z"/>
            </svg>
            <div className="font-medium text-lg mb-1 text-gray-900 dark:text-gray-100">
              {winner.username === players.find(p => p.id === currentUserId)?.username ? 
                <>You are the <span className="text-yellow-600 dark:text-yellow-400">Champion!</span></> : 
                <><span className="text-yellow-600 dark:text-yellow-400">{winner.username}</span> is the Champion!</>}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              George Cup - {currentSeason.name}
            </div>
          </div>
        ) : displayRound ? (
          <div>
            <div className="mb-2 flex justify-between items-center">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">{displayRound.round_name}</h3>
              {displayRound.game_week_start_date && (
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {format(new Date(displayRound.game_week_start_date), 'dd/MM/yy')}
                </span>
              )}
            </div>
            
            <div className="space-y-2 max-h-[100px] overflow-y-auto">
              {displayRound.fixtures.map((fixture: FixtureState) => {
                const isUserInFixture = fixture.player1_id === currentUserId || fixture.player2_id === currentUserId;
                
                // Skip showing fixtures not involving the user to save space
                if (!isUserInFixture && displayRound.fixtures.length > 2) return null;
                
                return (
                  <div 
                    key={fixture.id} 
                    className={`p-2 rounded ${isUserInFixture ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'bg-gray-100 dark:bg-gray-800'}`}
                  >
                    <div className="flex justify-between text-sm">
                      <div className={`${fixture.winner_id === fixture.player1_id ? 'font-medium text-green-600 dark:text-green-400' : 
                                      fixture.winner_id && fixture.player1_id === fixture.player1_id ? 'line-through text-red-600 dark:text-red-400' : ''}`}>
                        {fixture.player1_id ? 
                          players.find(p => p.id === fixture.player1_id)?.username : 
                          'BYE'}
                      </div>
                      {fixtureScores[fixture.id]?.player1_score !== undefined && (
                        <span className="font-medium">
                          {fixtureScores[fixture.id]?.player1_score}
                          <span className="text-xs ml-1 text-gray-500">({fixtureScores[fixture.id]?.player1_correct_scores})</span>
                        </span>
                      )}
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <div className={`${fixture.winner_id === fixture.player2_id ? 'font-medium text-green-600 dark:text-green-400' : 
                                      fixture.winner_id && fixture.player2_id ? 'line-through text-red-600 dark:text-red-400' : ''}`}>
                        {fixture.player2_id ? 
                          players.find(p => p.id === fixture.player2_id)?.username : 
                          'BYE'}
                      </div>
                      {fixtureScores[fixture.id]?.player2_score !== undefined && (
                        <span className="font-medium">
                          {fixtureScores[fixture.id]?.player2_score}
                          <span className="text-xs ml-1 text-gray-500">({fixtureScores[fixture.id]?.player2_correct_scores})</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {eliminatedInfo && (
              <div className="mt-3 text-center text-xs border-t border-gray-200 dark:border-gray-600 pt-2 text-gray-600 dark:text-gray-400">
                {displayRound.round_name} - Live {displayRound.game_week_start_date ? format(new Date(displayRound.game_week_start_date), 'dd/MM/yy') : 'TBD'}.
                <br />You were knocked out in the {eliminatedInfo.round}.
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600 dark:text-gray-300 text-center">No active rounds found</p>
          </div>
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