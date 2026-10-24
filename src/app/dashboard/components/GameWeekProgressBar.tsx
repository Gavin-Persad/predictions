"use client";

import type { GameWeekStatus } from '../../../utils/gameWeekStatus';
import { colors } from '../../stylecomponents/colors';

type GameWeekProgressBarProps = {
  gameWeek: {
    predictions_open: string;
    predictions_close: string;
    live_start: string;
    live_end: string;
  };
  status: GameWeekStatus | null;
  now: number;
};

function percentThrough(start: string, end: string, now: number): number {
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();

  if (now <= startTime) return 0;
  if (now >= endTime) return 100;

  return Math.min(100, Math.max(0, ((now - startTime) / (endTime - startTime)) * 100));
}

export default function GameWeekProgressBar({ gameWeek, status, now }: GameWeekProgressBarProps) {
  const isLiveTimeline = status === 'live' || status === 'awaiting_scores' || status === 'completed';

  const value = isLiveTimeline
    ? percentThrough(gameWeek.live_start, gameWeek.live_end, now)
    : percentThrough(gameWeek.predictions_open, gameWeek.predictions_close, now);

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-[13px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
        <span>{isLiveTimeline ? 'Kick Off' : 'Open for predictions'}</span>
        {isLiveTimeline && <span>Half Time</span>}
        <span>
          {isLiveTimeline ? (status === 'completed' ? 'Results Locked' : 'Final Whistle') : 'Predictions lock'}
        </span>
      </div>

      <div
        className="relative h-[6px] overflow-hidden rounded-full"
        style={{ backgroundColor: colors.field, border: `1px solid ${colors.borderStrong}` }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max(isLiveTimeline ? 0 : 4, value)}%`,
            background: 'linear-gradient(90deg, #B6F23C 0%, #D7F86F 100%)',
          }}
        />
      </div>
    </div>
  );
}
