"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../../../../supabaseClient';

export type StandingRow = {
  player_id: string;
  username: string;
  correct_scores: number;
  points: number;
  position: number;
};

type ScoreRow = {
  player_id: string;
  correct_scores: number | null;
  points: number | null;
  profiles: { username: string } | null;
};

export function useSeasonStandings(seasonId: string | null) {
  const [rows, setRows] = useState<StandingRow[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  // The host's score save broadcasts this so open tables refresh without a page reload.
  useEffect(() => {
    const handler = () => setReloadKey((key) => key + 1);
    window.addEventListener('season_scores_updated', handler);

    return () => window.removeEventListener('season_scores_updated', handler);
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!seasonId) {
        setRows([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const [userResult, playersResult, scoresResult] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('season_players').select('player_id').eq('season_id', seasonId),
        supabase
          .from('season_scores')
          .select('player_id, correct_scores, points, profiles (username)')
          .eq('season_id', seasonId),
      ]);

      if (!active) return;

      if (playersResult.error || scoresResult.error) {
        console.error('Error fetching standings:', playersResult.error ?? scoresResult.error);
        setRows([]);
        setLoading(false);
        return;
      }

      const validPlayerIds = new Set((playersResult.data ?? []).map((row: { player_id: string }) => row.player_id));

      const ranked = ((scoresResult.data ?? []) as unknown as ScoreRow[])
        .filter((row) => validPlayerIds.has(row.player_id) && row.profiles?.username)
        .map((row) => ({
          player_id: row.player_id,
          username: row.profiles!.username,
          correct_scores: row.correct_scores ?? 0,
          points: row.points ?? 0,
        }))
        .sort((a, b) => b.points - a.points || b.correct_scores - a.correct_scores)
        .map((row, index) => ({ ...row, position: index + 1 }));

      setCurrentUserId(userResult.data.user?.id ?? null);
      setRows(ranked);
      setLoading(false);
    };

    void load();

    return () => {
      active = false;
    };
  }, [seasonId, reloadKey]);

  return { rows, currentUserId, loading };
}
