"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../../../../supabaseClient';
import { determineGameWeekStatus, type GameWeekStatus } from '../../../utils/gameWeekStatus';
import { colors } from '../../stylecomponents/colors';
import ReadyForScores from './ReadyForScores';

type GameWeek = {
  id: string;
  week_number: number;
  predictions_open: string;
  predictions_close: string;
  live_start: string;
  live_end: string;
  fixtures: Array<{
    home_score: number | null;
    away_score: number | null;
  }>;
};

export default function AdminBar() {
  const [currentSeasonId, setCurrentSeasonId] = useState<string | null>(null);
  const [recentGameWeek, setRecentGameWeek] = useState<GameWeek | null>(null);
  const [gameWeekStatus, setGameWeekStatus] = useState<GameWeekStatus | null>(null);
  const [awaitingScoresWeeks, setAwaitingScoresWeeks] = useState<GameWeek[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReadyForScores, setShowReadyForScores] = useState(false);

  useEffect(() => {
    const fetchGameWeekStatus = async () => {
      try {
        const { data: seasonData, error: seasonError } = await supabase
          .from('seasons')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (seasonError || !seasonData) {
          setLoading(false);
          return;
        }

        setCurrentSeasonId(seasonData.id);

        const { data: gameWeeks, error: gameWeekError } = await supabase
          .from('game_weeks')
          .select(`
            id,
            week_number,
            predictions_open,
            predictions_close,
            live_start,
            live_end,
            fixtures (
              home_score,
              away_score
            )
          `)
          .eq('season_id', seasonData.id)
          .order('live_start', { ascending: false })
          .limit(1);

        if (gameWeekError || !gameWeeks || gameWeeks.length === 0) {
          setLoading(false);
          return;
        }

        const mostRecent = gameWeeks[0];
        setRecentGameWeek(mostRecent);

        const status = await determineGameWeekStatus(mostRecent);
        setGameWeekStatus(status);

        if (status === 'awaiting_scores') {
          const { data: allWeeks } = await supabase
            .from('game_weeks')
            .select(`
              id,
              week_number,
              predictions_open,
              predictions_close,
              live_start,
              live_end,
              fixtures (
                home_score,
                away_score
              )
            `)
            .eq('season_id', seasonData.id)
            .lt('live_end', new Date().toISOString())
            .order('live_start', { ascending: false });

          const awaiting: GameWeek[] = [];
          if (allWeeks) {
            for (const week of allWeeks) {
              const weekStatus = await determineGameWeekStatus(week);
              if (weekStatus === 'awaiting_scores') {
                awaiting.push(week);
              }
            }
          }
          setAwaitingScoresWeeks(awaiting);
        }
      } catch (error) {
        console.error('Error fetching game week status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGameWeekStatus();
  }, []);

  const getStatusEmoji = (status: GameWeekStatus): string => {
    switch (status) {
      case 'upcoming': return '📅';
      case 'predictions': return '✏️';
      case 'locked': return '🔒';
      case 'live': return '🎮';
      case 'awaiting_scores': return '📊';
      case 'completed': return '✅';
      default: return '❓';
    }
  };

  const getStatusColor = (status: GameWeekStatus): string => {
    switch (status) {
      case 'upcoming': return '#FFB020'; // yellow
      case 'predictions': return '#B6F23C'; // green
      case 'locked': return '#FF6B6B'; // red
      case 'live': return '#B6F23C'; // green
      case 'awaiting_scores': return '#B6F23C'; // lime green
      case 'completed': return '#B6F23C'; // green
      default: return '#8A97A6'; // grey
    }
  };

  const getStatusLabel = (status: GameWeekStatus): string => {
    switch (status) {
      case 'upcoming': return 'Upcoming';
      case 'predictions': return 'Predictions Open';
      case 'locked': return 'Predictions Locked';
      case 'live': return 'Games live';
      case 'awaiting_scores': return 'Awaiting correct scores';
      case 'completed': return 'Game week complete';
      default: return 'Unknown';
    }
  };

  if (showReadyForScores && currentSeasonId) {
    return (
      <ReadyForScores
        seasonId={currentSeasonId}
        onClose={() => setShowReadyForScores(false)}
      />
    );
  }

  if (loading) {
    return (
      <section
        aria-label="Host admin"
        className="w-full rounded-[18px] border p-4 md:p-5"
        style={{ backgroundColor: colors.panel, borderColor: colors.border }}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">Host alerts</p>
          <Link
            href="/admin"
            className="rounded-full border px-3 py-1.5 text-sm font-medium text-[var(--color-text)] transition-colors hover:opacity-80"
            style={{ borderColor: colors.borderStrong, backgroundColor: colors.field }}
          >
            Admin View
          </Link>
        </div>
        <div
          className="flex min-h-[72px] items-center justify-center rounded-lg border border-dashed text-sm text-[var(--color-muted)]"
          style={{ backgroundColor: colors.field, borderColor: colors.borderStrong }}
        >
          Loading...
        </div>
      </section>
    );
  }

  if (!recentGameWeek || !gameWeekStatus) {
    return (
      <section
        aria-label="Host admin"
        className="w-full rounded-[18px] border p-4 md:p-5"
        style={{ backgroundColor: colors.panel, borderColor: colors.border }}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">Host alerts</p>
          <Link
            href="/admin"
            className="rounded-full border px-3 py-1.5 text-sm font-medium text-[var(--color-text)] transition-colors hover:opacity-80"
            style={{ borderColor: colors.borderStrong, backgroundColor: colors.field }}
          >
            Admin View
          </Link>
        </div>
        <div
          className="flex min-h-[72px] items-center justify-center rounded-lg border border-dashed text-sm text-[var(--color-muted)]"
          style={{ backgroundColor: colors.field, borderColor: colors.borderStrong }}
        >
          Relax, everything is up to date
        </div>
      </section>
    );
  }

  if (gameWeekStatus === 'awaiting_scores' && awaitingScoresWeeks.length > 0) {
    return (
      <section
        aria-label="Host admin"
        className="w-full rounded-[18px] border p-4 md:p-5"
        style={{ backgroundColor: colors.panel, borderColor: colors.border }}
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">Host alerts</p>
          <Link
            href="/admin"
            className="rounded-full border px-3 py-1.5 text-sm font-medium text-[var(--color-text)] transition-colors hover:opacity-80"
            style={{ borderColor: colors.borderStrong, backgroundColor: colors.field }}
          >
            Admin View
          </Link>
        </div>

        <div className="space-y-3">
          {awaitingScoresWeeks.map((week) => (
            <div
              key={week.id}
              className="rounded-[14px] border p-4 md:p-5 flex items-center justify-between gap-4 flex-wrap"
              style={{ 
                backgroundColor: '#B6F23C',
                borderColor: '#B6F23C',
                color: '#0B0F14'
              }}
            >
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-base font-semibold">
                    Game week {week.week_number} is ready for scores
                  </div>
                  <div className="text-sm mt-1" style={{ color: '#2A3A10' }}>
                    All {week.fixtures?.length || 0} fixtures have finished
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowReadyForScores(true)}
                className="text-sm font-semibold px-4 py-2.5 rounded-[10px]"
                style={{ 
                  backgroundColor: '#0B0F14',
                  color: '#B6F23C',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Enter scores
              </button>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Host admin"
      className="w-full rounded-[18px] border p-4 md:p-5"
      style={{ backgroundColor: colors.panel, borderColor: colors.border }}
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">Host alerts</p>
        <Link
          href="/admin"
          className="rounded-full border px-3 py-1.5 text-sm font-medium text-[var(--color-text)] transition-colors hover:opacity-80"
          style={{ borderColor: colors.borderStrong, backgroundColor: colors.field }}
        >
          Admin View
        </Link>
      </div>

      <div
        className="rounded-lg border p-4 flex items-center justify-between"
        style={{ 
          backgroundColor: colors.field, 
          borderColor: colors.borderStrong,
          color: getStatusColor(gameWeekStatus)
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getStatusEmoji(gameWeekStatus)}</span>
          <div>
            <p className="font-semibold">Game week {recentGameWeek.week_number}</p>
            <p className="text-sm">{getStatusLabel(gameWeekStatus)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

