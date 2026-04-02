"use client";

import React, { useEffect, useState } from 'react';
import Sidebar from '../../../../components/Sidebar';
import DarkModeToggle from '../../../../components/darkModeToggle';
import { supabase } from '../../../../../supabaseClient';

type Props = {
  seasonId: string;
  onClose: () => void;
};

type ManagerMonth = {
  id: string;
  month_label: string;
  month_start: string;
};

type PlayerScore = {
  player_id: string;
  username: string;
  correct_scores: number;
  points: number;
  position: number;
};

export default function ManagerOfTheMonth({ seasonId, onClose }: Props) {
  const [months, setMonths] = useState<ManagerMonth[]>([]);
  const [selectedMonthId, setSelectedMonthId] = useState<string | null>(null);
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadMonths = async () => {
      const { data, error } = await supabase
        .from('manager_months')
        .select('id, month_label, month_start')
        .eq('season_id', seasonId)
        .order('month_start', { ascending: true });

      if (error) {
        console.error('Error loading manager months', error);
        return;
      }
      setMonths((data as ManagerMonth[]) || []);
    };

    loadMonths();
  }, [seasonId]);

  useEffect(() => {
    if (!selectedMonthId) return;

    const loadScoresForMonth = async () => {
      setLoading(true);
      try {
        // get assigned game weeks for the month
        const { data: assignData, error: assignError } = await supabase
          .from('manager_month_game_weeks')
          .select('game_week_id')
          .eq('manager_month_id', selectedMonthId);

        if (assignError) throw assignError;

        const gwIds = (assignData || []).map((r: any) => r.game_week_id).filter(Boolean);

        if (gwIds.length === 0) {
          setScores([]);
          setLoading(false);
          return;
        }

        // fetch valid players for season
        const { data: seasonPlayers } = await supabase
          .from('season_players')
          .select('player_id')
          .eq('season_id', seasonId);

        const validPlayerIds = new Set((seasonPlayers || []).map((p: any) => p.player_id));

        // fetch all game_week_scores for these game weeks
        const { data: gwScores, error: gwScoresError } = await supabase
          .from('game_week_scores')
          .select('player_id, correct_scores, points')
          .in('game_week_id', gwIds as string[]);

        if (gwScoresError) throw gwScoresError;

        // aggregate
        const totals: Record<string, { correct_scores: number; points: number }> = {};
        (gwScores || []).forEach((row: any) => {
          if (!validPlayerIds.has(row.player_id)) return;
          if (!totals[row.player_id]) totals[row.player_id] = { correct_scores: 0, points: 0 };
          totals[row.player_id].correct_scores += row.correct_scores || 0;
          totals[row.player_id].points += row.points || 0;
        });

        const playerIds = Object.keys(totals);

        if (playerIds.length === 0) {
          setScores([]);
          setLoading(false);
          return;
        }

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', playerIds as string[]);

        const usernameById: Record<string, string> = {};
        (profiles || []).forEach((p: any) => { usernameById[p.id] = p.username; });

        const formatted: PlayerScore[] = playerIds.map((pid) => ({
          player_id: pid,
          username: usernameById[pid] || pid,
          correct_scores: totals[pid].correct_scores,
          points: totals[pid].points,
          position: 0,
        }));

        const sorted = formatted.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.correct_scores !== a.correct_scores) return b.correct_scores - a.correct_scores;
          return a.username.localeCompare(b.username);
        }).map((s, i) => ({ ...s, position: i + 1 }));

        setScores(sorted);
      } catch (err) {
        console.error('Error loading monthly scores', err);
      } finally {
        setLoading(false);
      }
    };

    loadScoresForMonth();
  }, [selectedMonthId, seasonId]);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-grow flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="absolute top-4 right-4">
          <DarkModeToggle />
        </div>

        <div className="w-full max-w-4xl mx-auto px-[5%]">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Manager of the Month</h2>
          <button onClick={onClose} className="mb-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700">Back</button>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <label className="block mb-2 text-gray-700 dark:text-gray-300">Select Month</label>
            <select
              value={selectedMonthId || ''}
              onChange={(e) => setSelectedMonthId(e.target.value || null)}
              className="px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 w-full"
            >
              <option value="">-- Select month --</option>
              {months.map(m => (
                <option key={m.id} value={m.id}>{m.month_label}</option>
              ))}
            </select>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            {loading ? (
              <div className="text-gray-700 dark:text-gray-300">Loading...</div>
            ) : !selectedMonthId ? (
              <div className="text-gray-700 dark:text-gray-300">Please select a month to view standings.</div>
            ) : scores.length === 0 ? (
              <div className="text-gray-700 dark:text-gray-300">No scores yet for this month — coming soon.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full table-fixed">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="w-[15%] px-2 sm:px-3 py-3 text-left">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pos</span>
                      </th>
                      <th className="w-[40%] px-2 sm:px-4 py-3 text-left">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Player</span>
                      </th>
                      <th className="w-[20%] px-2 sm:px-3 py-3 text-center">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">CS</span>
                      </th>
                      <th className="w-[25%] px-2 sm:px-3 py-3 text-center">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pts</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {scores.map(s => (
                      <tr key={s.player_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-2 sm:px-3 py-4 text-gray-900 dark:text-gray-100">{s.position}</td>
                        <td className="px-2 sm:px-4 py-4 truncate text-gray-900 dark:text-gray-100">{s.username}</td>
                        <td className="px-2 sm:px-3 py-4 text-center text-gray-900 dark:text-gray-100">{s.correct_scores}</td>
                        <td className="px-2 sm:px-3 py-4 text-center text-gray-900 dark:text-gray-100">{s.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
