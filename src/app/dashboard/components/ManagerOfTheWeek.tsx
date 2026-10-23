"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../../../../supabaseClient';
import { colors } from '../../stylecomponents/colors';

type ManagerOfTheWeekProps = {
  gameWeekId: string;
  seasonId: string;
  weekNumber: number;
  onClose: () => void;
};

type SortField = 'position' | 'username' | 'correct_scores' | 'points';

type PlayerScore = {
  player_id: string;
  username: string;
  correct_scores: number;
  points: number;
  position: number;
};

type ScoreRow = {
  player_id: string;
  correct_scores: number;
  points: number;
  profiles: { username: string };
};

const COLUMNS: Array<{ field: SortField; label: string; align: 'left' | 'center' }> = [
  { field: 'position', label: 'Pos', align: 'left' },
  { field: 'username', label: 'Player', align: 'left' },
  { field: 'correct_scores', label: 'Correct', align: 'center' },
  { field: 'points', label: 'Points', align: 'center' },
];

export default function ManagerOfTheWeek({ gameWeekId, seasonId, weekNumber, onClose }: ManagerOfTheWeekProps) {
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sortField, setSortField] = useState<SortField>('position');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      setLoading(true);
      setMessage('');

      const { data: { user } } = await supabase.auth.getUser();
      if (active && user) setCurrentUserId(user.id);

      const { data: seasonPlayers, error: playersError } = await supabase
        .from('season_players')
        .select('player_id')
        .eq('season_id', seasonId);

      if (playersError || !seasonPlayers) {
        console.error('Error fetching season players:', playersError);
        if (active) {
          setMessage('Error fetching scores');
          setLoading(false);
        }
        return;
      }

      const { data: rawData, error } = await supabase
        .from('game_week_scores')
        .select('player_id, correct_scores, points, profiles!inner (username)')
        .eq('game_week_id', gameWeekId);

      if (error || !rawData) {
        console.error('Error:', error);
        if (active) {
          setMessage('Error fetching scores');
          setLoading(false);
        }
        return;
      }

      const validPlayerIds = new Set(seasonPlayers.map((player) => player.player_id));

      const ranked = (rawData as unknown as ScoreRow[])
        .filter((row) => validPlayerIds.has(row.player_id))
        .map((row) => ({
          player_id: row.player_id,
          username: row.profiles.username,
          correct_scores: row.correct_scores,
          points: row.points,
        }))
        .sort((a, b) => b.points - a.points || b.correct_scores - a.correct_scores)
        .map((row, index) => ({ ...row, position: index + 1 }));

      if (!active) return;
      setScores(ranked);
      setLoading(false);
    };

    void fetchData();

    return () => {
      active = false;
    };
  }, [gameWeekId, seasonId]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'username' || field === 'position' ? 'asc' : 'desc');
    }
  };

  const sortedScores = [...scores].sort((a, b) => {
    const modifier = sortDirection === 'asc' ? 1 : -1;
    if (sortField === 'username') return modifier * a.username.localeCompare(b.username);
    return modifier * (a[sortField] - b[sortField]);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-[18px] border p-5 shadow-2xl"
        style={{ backgroundColor: colors.panel, borderColor: colors.border }}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Game Week {weekNumber}</p>
            <h3 className="text-xl font-semibold text-[var(--color-text)]">🏆 Manager of the Week</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border px-3 py-1.5 text-sm font-medium text-[var(--color-text)]"
            style={{ borderColor: colors.borderStrong, backgroundColor: colors.field }}
          >
            Close
          </button>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-[var(--color-muted)]">Loading...</p>
        ) : message ? (
          <p className="py-8 text-center text-sm" style={{ color: colors.errorText }}>{message}</p>
        ) : scores.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--color-muted)]">No scores have been entered for this game week yet.</p>
        ) : (
          <div className="overflow-auto rounded-lg border" style={{ borderColor: colors.border }}>
            <table className="min-w-full border-collapse text-[var(--color-text)]">
              <thead className="sticky top-0" style={{ backgroundColor: colors.panel }}>
                <tr>
                  {COLUMNS.map((column) => (
                    <th
                      key={column.field}
                      onClick={() => handleSort(column.field)}
                      className={`cursor-pointer border-b px-3 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-muted)] ${
                        column.align === 'center' ? 'text-center' : 'text-left'
                      }`}
                      style={{ borderColor: colors.border }}
                    >
                      {column.label}
                      {sortField === column.field && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedScores.map((score) => {
                  const isCurrentUser = score.player_id === currentUserId;
                  const isWinner = score.position === 1;

                  return (
                    <tr
                      key={score.player_id}
                      className={isCurrentUser || isWinner ? 'font-semibold' : ''}
                      style={{ backgroundColor: isCurrentUser ? '#1F2E14' : undefined }}
                    >
                      <td className="border-b px-3 py-2 text-left text-sm" style={{ borderColor: colors.border, color: isWinner ? colors.lime : undefined }}>
                        {isWinner ? '🏆' : score.position}
                      </td>
                      <td className="border-b px-3 py-2 text-left text-sm" style={{ borderColor: colors.border, color: isWinner ? colors.lime : undefined }}>
                        {score.username}
                      </td>
                      <td className="border-b px-3 py-2 text-center text-sm" style={{ borderColor: colors.border }}>
                        {score.correct_scores}
                      </td>
                      <td className="border-b px-3 py-2 text-center text-sm" style={{ borderColor: colors.border }}>
                        {score.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
