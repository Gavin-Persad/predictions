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
        const weekNumbers = (gameWeeksData ?? []).map((gw) => gw.week_number);

        if (gameWeekIds.length === 0) {
          setProgressionData([]);
          setWeeks([]);
          setLoading(false);
          return;
        }

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

        if (!active) return;

        const { data: seasonScoresData } = await supabase
          .from('season_scores')
          .select('player_id, points, correct_scores, profiles (username)')
          .eq('season_id', seasonId)
          .order('points', { ascending: false });

        const { data: seasonPlayersData } = await supabase
          .from('season_players')
          .select('player_id')
          .eq('season_id', seasonId);

        const validPlayerIds = new Set(
          (seasonPlayersData ?? []).map((sp: { player_id: string }) => sp.player_id)
        );

        const playerDataMap = new Map<
          string,
          { username: string; cumulative_points: number; week_points: Map<number, number> }
        >();

        for (const score of scoresData ?? []) {
          const row = score as unknown as GameWeekScoreRow;
          if (!validPlayerIds.has(row.player_id) || !row.profiles?.username) continue;

          if (!playerDataMap.has(row.player_id)) {
            playerDataMap.set(row.player_id, {
              username: row.profiles.username,
              cumulative_points: 0,
              week_points: new Map(),
            });
          }

          const playerData = playerDataMap.get(row.player_id)!;
          playerData.cumulative_points += row.points ?? 0;

          if (row.game_weeks?.week_number) {
            playerData.week_points.set(row.game_weeks.week_number, playerData.cumulative_points);
          }
        }

        const playerDataArray = Array.from(playerDataMap.entries()).map(([playerId, data]) => ({
          player_id: playerId,
          username: data.username,
          week_points: data.week_points,
        }));

        const progressionArray: ProgressionData[] = playerDataArray.map((player) => {
          const weekly_positions: Record<number, number> = {};

          for (const week of weekNumbers) {
            const pointsUpToWeek = player.week_points.get(week);

            if (pointsUpToWeek !== undefined) {
              const position = playerDataArray.filter((p) => {
                const pPoints = p.week_points.get(week);
                return pPoints !== undefined && pPoints > pointsUpToWeek;
              }).length + 1;

              weekly_positions[week] = position;
            }
          }

          return {
            player_id: player.player_id,
            username: player.username,
            weekly_positions,
            weeks: weekNumbers,
            current_position: 0,
          };
        });

        const standings: CurrentStandings[] = ((seasonScoresData ?? []) as unknown as Array<{
          player_id: string;
          points: number;
          correct_scores: number;
          profiles: { username: string } | null;
        }>)
          .filter((row) => validPlayerIds.has(row.player_id) && row.profiles?.username)
          .map((row, index) => ({
            player_id: row.player_id,
            username: row.profiles!.username,
            position: index + 1,
            points: row.points,
          }));

        const standingsMap = new Map(standings.map((s) => [s.player_id, s]));

        const sortedProgression = progressionArray.map((p) => ({
          ...p,
          current_position: standingsMap.get(p.player_id)?.position ?? 999,
        }));

        sortedProgression.sort((a, b) => a.current_position - b.current_position);

        setProgressionData(sortedProgression);
        setCurrentStandings(standings);
        setWeeks(weekNumbers);
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
