"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../../../supabaseClient';
import { colors } from '../../stylecomponents/colors';
import type { Season } from '../components/ChooseSeason';
import { loadManagerMonthStandings, type ManagerMonthStandings } from './managerMonthData';

const ROW_HEIGHT = 20;
const GRID = 'grid grid-cols-[2rem_minmax(0,1fr)_2.5rem_3rem] items-center gap-2 px-2';

type ManagerOfTheMonthProps = {
  season: Season | null;
  seasonLoading?: boolean;
  onOpen: (data: ManagerMonthStandings[], monthId: string, currentUserId: string | null) => void;
};

function formatMonth(month: ManagerMonthStandings['month']): string {
  return month.month_label;
}

export default function ManagerOfTheMonth({ season, seasonLoading = false, onOpen }: ManagerOfTheMonthProps) {
  const [data, setData] = useState<ManagerMonthStandings[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoresUpdate, setScoresUpdate] = useState(0);
  const rowsRef = useRef<HTMLSpanElement>(null);
  const [capacity, setCapacity] = useState(3);
  const seasonId = season?.id ?? null;

  useEffect(() => {
    let refreshTimeout: number | undefined;
    const refresh = () => {
      window.clearTimeout(refreshTimeout);
      refreshTimeout = window.setTimeout(() => setScoresUpdate((current) => current + 1), 250);
    };
    const handleScoresUpdated = () => refresh();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    window.addEventListener('season_scores_updated', handleScoresUpdated);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', handleVisibility);

    const subscription = supabase
      .channel('manager_month_game_week_scores')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_week_scores' }, refresh)
      .subscribe();

    return () => {
      window.clearTimeout(refreshTimeout);
      window.removeEventListener('season_scores_updated', refresh);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', handleVisibility);
      void supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!seasonId) {
        setData([]);
        setCurrentUserId(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [userResult, standings] = await Promise.all([
          supabase.auth.getUser(),
          loadManagerMonthStandings(seasonId),
        ]);

        if (!active) return;
        setCurrentUserId(userResult.data.user?.id ?? null);
        setData(standings);
      } catch (error) {
        console.error('Error loading Manager of the Month:', error);
        if (active) setData([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [seasonId, scoresUpdate]);

  useEffect(() => {
    const element = rowsRef.current;
    if (!element) return;

    const update = () => setCapacity(Math.max(1, Math.floor(element.clientHeight / ROW_HEIGHT)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const latestScoredMonth = data.find((entry) => entry.scores.length > 0);
  const firstMonth = data[data.length - 1];
  const displayedMonth = latestScoredMonth ?? firstMonth;
  const visibleRows = useMemo(() => {
    if (!latestScoredMonth) return [];

    const mine = latestScoredMonth.scores.find((row) => row.player_id === currentUserId);
    if (!mine || mine.position <= capacity) return latestScoredMonth.scores.slice(0, capacity);

    return [...latestScoredMonth.scores.slice(0, Math.max(0, capacity - 1)), mine];
  }, [latestScoredMonth, capacity, currentUserId]);

  const isLoading = seasonLoading || loading;
  const monthName = displayedMonth ? formatMonth(displayedMonth.month) : null;
  const canOpen = Boolean(displayedMonth);

  return (
    <button
      type="button"
      onClick={() => displayedMonth && onOpen(data, displayedMonth.month.id, currentUserId)}
      disabled={!canOpen}
      aria-label={monthName ? `View Manager of the Month for ${monthName}` : 'Manager of the Month'}
      className="flex h-full min-h-[220px] w-full flex-col rounded-[14px] border p-4 text-left transition-colors hover:border-[var(--color-lime)] disabled:cursor-default"
      style={{ backgroundColor: colors.panel, borderColor: colors.border }}
    >
      <span className="text-sm font-semibold text-[var(--color-text)]">
        {monthName ? `Manager of the Month: ${monthName}` : 'Manager of the Month'}
      </span>

      <span className={`${GRID} mt-2 text-xs uppercase tracking-[0.06em] text-[var(--color-muted)]`}>
        <span>#</span>
        <span>Player</span>
        <span className="text-right">CS</span>
        <span className="text-right">Pts</span>
      </span>

      <span ref={rowsRef} className="mt-1 flex min-h-[100px] grow flex-col">
        {isLoading ? (
          <span className="py-3 text-center text-sm text-[var(--color-muted)]">Loading standings...</span>
        ) : !latestScoredMonth ? (
          <span className="py-3 text-center text-sm font-medium" style={{ color: colors.lime }}>Coming soon</span>
        ) : visibleRows.length === 0 ? (
          <span className="py-3 text-center text-sm text-[var(--color-muted)]">No monthly scores yet</span>
        ) : (
          visibleRows.map((row) => {
            const isMe = row.player_id === currentUserId;
            return (
              <span
                key={row.player_id}
                className={`${GRID} shrink-0 rounded-md text-xs ${isMe ? 'font-semibold' : ''}`}
                style={{
                  height: ROW_HEIGHT,
                  backgroundColor: isMe ? '#1F2E14' : undefined,
                  color: isMe ? colors.lime : colors.muted,
                }}
              >
                <span>{row.position}</span>
                <span className="truncate">{row.username}{isMe && ' (You)'}</span>
                <span className="text-right">{row.correct_scores}</span>
                <span className="text-right">{row.points}</span>
              </span>
            );
          })
        )}
      </span>

      <span className="mt-1 block text-center text-xs font-medium" style={{ color: colors.lime }}>
        View full table →
      </span>
    </button>
  );
}
