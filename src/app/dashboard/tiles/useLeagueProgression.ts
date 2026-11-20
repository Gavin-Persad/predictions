"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../../../../supabaseClient';

export type ProgressionData = {
  player_id: string;
  username: string;
  weekly_positions: Record<number, number>;
  weeks: number[];
  current_position: number;
};

export type CurrentStandings = {
  player_id: string;
  username: string;
  position: number;
  points: number;
};

type GameWeekScoreRow = {
  player_id: string;
  game_week_id: string;
  points: number;
  correct_scores: number;
  profiles: { username: string } | null;
  game_weeks: { week_number: number } | null;
};

export function useLeagueProgression(seasonId: string | null) {
  const [progressionData, setProgressionData] = useState<ProgressionData[]>([]);
  const [currentStandings, setCurrentStandings] = useState<CurrentStandings[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [weeks, setWeeks] = useState<number[]>([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!seasonId) {
        setProgressionData([]);
        setCurrentStandings([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const userResult = await supabase.auth.getUser();
        setCurrentUserId(userResult.data.user?.id ?? null);

        const { data: gameWeeksData, error: weeksError } = await supabase
          .from('game_weeks')
          .select('id, week_number')
          .eq('season_id', seasonId)
          .order('week_number', { ascending: true });

        if (weeksError) {
          console.error('Error fetching game weeks:', weeksError);
          setProgressionData([]);
          setLoading(false);
          return;
        }

        const gameWeekIds = (gameWeeksData ?? []).map((gw) => gw.id);

        if (gameWeekIds.length === 0) {
          setProgressionData([]);
          setWeeks([]);
          setLoading(false);
          return;
        }

        const { data: seasonPlayersData } = await supabase
          .from('season_players')
          .select('player_id, profiles (username)')
          .eq('season_id', seasonId);

        const validPlayerIds = new Set(
          (seasonPlayersData ?? []).map((sp: { player_id: string }) => sp.player_id)
        );

        const { data: scoresData, error: scoresError } = await supabase
          .from('game_week_scores')
          .select(
            'player_id, game_week_id, points, correct_scores, profiles:player_id (username), game_weeks:game_week_id (week_number)'
          )
          .in('game_week_id', gameWeekIds);

        if (scoresError) {
          console.error('Error fetching scores:', scoresError);
          setProgressionData([]);
          setLoading(false);
          return;
        }

        // Supabase has a hard limit of 1000 rows per query. If we got exactly 1000, 
        // we may be hitting the limit. Batch the requests to get all data.
        let allScoresData = scoresData ?? [];
        
        if ((scoresData ?? []).length === 1000) {
          // Batch gameWeekIds into chunks of 10 to avoid the limit
          const chunkSize = 10;
          allScoresData = [];
          
          for (let i = 0; i < gameWeekIds.length; i += chunkSize) {
            const chunk = gameWeekIds.slice(i, i + chunkSize);
            const { data: chunkData, error: chunkError } = await supabase
              .from('game_week_scores')
              .select(
                'player_id, game_week_id, points, correct_scores, profiles:player_id (username), game_weeks:game_week_id (week_number)'
              )
              .in('game_week_id', chunk);
            
            if (!chunkError && chunkData) {
              allScoresData = allScoresData.concat(chunkData);
            }
          }
        }

        // Sort scores by week number to ensure cumulative calculation is correct
        const sortedScores = (allScoresData ?? []).sort((a: any, b: any) => {
          const weekA = a.game_weeks?.week_number ?? 0;
          const weekB = b.game_weeks?.week_number ?? 0;
          return weekA - weekB;
        });

        if (!active) return;

        const playerDataMap = new Map<
          string,
          { 
            username: string
            cumulative_points: number
            cumulative_correct_scores: number
            week_points: Map<number, number>
            week_correct_scores: Map<number, number>
          }
        >();

        for (const score of sortedScores) {
          const row = score as unknown as GameWeekScoreRow;
          if (!validPlayerIds.has(row.player_id) || !row.profiles?.username) continue;

          if (!playerDataMap.has(row.player_id)) {
            playerDataMap.set(row.player_id, {
              username: row.profiles.username,
              cumulative_points: 0,
              cumulative_correct_scores: 0,
              week_points: new Map(),
              week_correct_scores: new Map(),
            });
          }

          const playerData = playerDataMap.get(row.player_id)!;
          const pointsToAdd = row.points ?? 0;
          const correctScoresToAdd = row.correct_scores ?? 0;
          
          playerData.cumulative_points += pointsToAdd;
          playerData.cumulative_correct_scores += correctScoresToAdd;

          if (row.game_weeks?.week_number) {
            playerData.week_points.set(row.game_weeks.week_number, playerData.cumulative_points);
            playerData.week_correct_scores.set(row.game_weeks.week_number, playerData.cumulative_correct_scores);
          }
        }

        const playerDataArray = Array.from(playerDataMap.entries()).map(([playerId, data]) => ({
          player_id: playerId,
          username: data.username,
          week_points: data.week_points,
          week_correct_scores: data.week_correct_scores,
        }));

        // Only use weeks that actually have data
        const weeksWithData = new Set<number>();
        playerDataArray.forEach(p => {
          p.week_points.forEach((_, week) => weeksWithData.add(week));
        });
        const weeksToDisplay = Array.from(weeksWithData).sort((a, b) => a - b);

        const progressionArray: ProgressionData[] = playerDataArray.map((player) => {
          const weekly_positions: Record<number, number> = {};
          let lastKnownPosition = 0;

          for (const week of weeksToDisplay) {
            const pointsUpToWeek = player.week_points.get(week);

            // Check if this player has actual data for this week
            if (pointsUpToWeek !== undefined) {
              // This player has data for this week - calculate their position among all players who submitted
              const correctScoresUpToWeek = player.week_correct_scores.get(week);
              
              const position = playerDataArray.filter((p) => {
                const pPoints = p.week_points.get(week);
                
                // Only count players who also submitted for this week
                if (pPoints === undefined) return false;
                
                const pCorrectScores = p.week_correct_scores.get(week);
                
                if (pPoints > pointsUpToWeek) return true;
                if (pPoints === pointsUpToWeek && pCorrectScores !== undefined && correctScoresUpToWeek !== undefined) {
                  if (pCorrectScores > correctScoresUpToWeek) return true;
                  if (pCorrectScores === correctScoresUpToWeek && p.username < player.username) return true;
                }
                
                return false;
              }).length + 1;

              lastKnownPosition = position;
              weekly_positions[week] = position;
            } else {
              // This player didn't submit for this week - keep their last known position
              if (lastKnownPosition > 0) {
                weekly_positions[week] = lastKnownPosition;
              }
            }
          }

          return {
            player_id: player.player_id,
            username: player.username,
            weekly_positions,
            weeks: weeksToDisplay,
            current_position: 0,
          };
        });

        // Calculate final standings from progression data
        // Sort by final position (which is based on cumulative points)
        const standings: CurrentStandings[] = playerDataArray
          .map((player) => {
            // Get the final week's points
            const finalWeek = weeksToDisplay[weeksToDisplay.length - 1];
            const finalPoints = player.week_points.get(finalWeek) ?? 0;
            
            return {
              player_id: player.player_id,
              username: player.username,
              position: 0, // Will be set after sorting
              points: finalPoints,
            };
          })
          .sort((a, b) => {
            const aPoints = a.points;
            const bPoints = b.points;
            if (aPoints !== bPoints) return bPoints - aPoints;
            return 0;
          })
          .map((standing, index) => ({
            ...standing,
            position: index + 1,
          }));

        const standingsMap = new Map(standings.map((s) => [s.player_id, s]));

        const sortedProgression = progressionArray.map((p) => ({
          ...p,
          current_position: standingsMap.get(p.player_id)?.position ?? 999,
        }));

        sortedProgression.sort((a, b) => a.current_position - b.current_position);

        setProgressionData(sortedProgression);
        setCurrentStandings(standings);
        setWeeks(weeksToDisplay);
      } catch (error) {
        console.error('Error in useLeagueProgression:', error);
        setProgressionData([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [seasonId]);

  return { progressionData, currentStandings, currentUserId, loading, weeks };
}
