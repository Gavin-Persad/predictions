"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { colors } from '../../stylecomponents/colors';
import type { Season } from '../components/ChooseSeason';
import { useSeasonStandings } from './useSeasonStandings';

const ROW_HEIGHT = 32;
const GRID = 'grid grid-cols-[2rem_minmax(0,1fr)_2.5rem_3rem] items-center gap-2 px-2';

type LeagueTableProps = {
  season: Season | null;
  seasonLoading?: boolean;
  onOpen: () => void;
};

export default function LeagueTable({ season, seasonLoading = false, onOpen }: LeagueTableProps) {
  const { rows, currentUserId, loading } = useSeasonStandings(season?.id ?? null);
  const rowsRef = useRef<HTMLSpanElement>(null);
  const [capacity, setCapacity] = useState(5);

  useEffect(() => {
    const element = rowsRef.current;
    if (!element) return;

    const update = () => setCapacity(Math.max(1, Math.floor(element.clientHeight / ROW_HEIGHT)));
    update();

    const observer = new ResizeObserver(update);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  // If the player is outside the visible rows, their real position replaces the last row.
  const visibleRows = useMemo(() => {
    const mine = rows.find((row) => row.player_id === currentUserId);
    if (!mine || mine.position <= capacity) return rows.slice(0, capacity);

    return [...rows.slice(0, capacity - 1), mine];
  }, [rows, capacity, currentUserId]);

  const isLoading = seasonLoading || loading;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="View full league table"
      className="flex h-full min-h-[320px] w-full flex-col rounded-[14px] border p-4 text-left transition-colors hover:border-[var(--color-lime)] lg:min-h-0"
      style={{ backgroundColor: colors.panel, borderColor: colors.border }}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-[var(--color-text)]">League table</span>
        {season && <span className="text-xs text-[var(--color-muted)]">{season.name}</span>}
      </span>

      <span className={`${GRID} mt-3 text-xs uppercase tracking-[0.06em] text-[var(--color-muted)]`}>
        <span>#</span>
        <span>Player</span>
        <span className="text-right">CS</span>
        <span className="text-right">Pts</span>
      </span>

      <span ref={rowsRef} className="mt-1 flex min-h-0 grow basis-0 flex-col overflow-hidden">
        {isLoading ? (
          <span className="py-6 text-center text-sm text-[var(--color-muted)]">Loading standings...</span>
        ) : visibleRows.length === 0 ? (
          <span className="py-6 text-center text-sm text-[var(--color-muted)]">No league standings available</span>
        ) : (
          visibleRows.map((row) => {
            const isMe = row.player_id === currentUserId;

            return (
              <span
                key={row.player_id}
                className={`${GRID} shrink-0 rounded-md text-sm ${isMe ? 'font-semibold' : ''}`}
                style={{
                  height: ROW_HEIGHT,
                  backgroundColor: isMe ? '#1F2E14' : undefined,
                  color: isMe ? colors.lime : colors.muted,
                }}
              >
                <span>{row.position}</span>
                <span className="truncate">
                  {row.username}
                  {isMe && ' (You)'}
                </span>
                <span className="text-right">{row.correct_scores}</span>
                <span className="text-right">{row.points}</span>
              </span>
            );
          })
        )}
      </span>

      <span className="mt-2 block text-center text-sm font-medium" style={{ color: colors.lime }}>
        View full table →
      </span>
    </button>
  );
}
