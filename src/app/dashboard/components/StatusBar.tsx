"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../../supabaseClient';
import { determineGameWeekStatus } from '../../../utils/gameWeekStatus';
import { colors } from '../../stylecomponents/colors';
import LoadingSpinner from '../../stylecomponents/loading';
import ChooseGameWeekModal from './ChooseGameWeek';
import EnterScores from './EnterScores';
import ViewGameWeek from './ViewGameWeek';

type Season = {
  id: string;
  name: string;
};

type GameWeek = {
  id: string;
  season_id: string;
  week_number: number;
  predictions_open: string;
  predictions_close: string;
  live_start: string;
  live_end: string;
  created_at: string;
};

export default function StatusBar() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [gameWeeks, setGameWeeks] = useState<GameWeek[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [selectedGameWeek, setSelectedGameWeek] = useState<GameWeek | null>(null);
  const [status, setStatus] = useState<Awaited<ReturnType<typeof determineGameWeekStatus>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChooseGameWeek, setShowChooseGameWeek] = useState(false);
  const [activePanel, setActivePanel] = useState<'status' | 'view' | 'scores'>('status');
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 1000);

    return () => window.clearInterval(timer);
  }, []);

  const fetchGameWeeksForSeason = useCallback(
    async (seasonId: string) => {
      const { data, error } = await supabase
        .from('game_weeks')
        .select('id, season_id, week_number, predictions_open, predictions_close, live_start, live_end, created_at')
        .eq('season_id', seasonId)
        .order('week_number', { ascending: true });

      if (error) {
        console.error('Error fetching game weeks:', error);
        setGameWeeks([]);
        return;
      }

      const sorted = (data ?? []).sort((a, b) => a.week_number - b.week_number);
      setGameWeeks(sorted);

      if (sorted.length > 0 && !sorted.some((gameWeek) => gameWeek.id === selectedGameWeek?.id)) {
        setSelectedGameWeek(sorted[0]);
      }
    },
    [selectedGameWeek?.id],
  );

  useEffect(() => {
    const initialise = async () => {
      const { data: seasonData, error: seasonError } = await supabase
        .from('seasons')
        .select('id, name')
        .order('created_at', { ascending: false });

      if (seasonError) {
        console.error('Error fetching seasons:', seasonError);
        setLoading(false);
        return;
      }

      const mappedSeasons = seasonData ?? [];
      setSeasons(mappedSeasons);

      if (!mappedSeasons.length) {
        setLoading(false);
        return;
      }

      const fallbackSeasonId = mappedSeasons[0].id;
      setSelectedSeasonId(fallbackSeasonId);

      const { data: latestWeek, error: weekError } = await supabase
        .from('game_weeks')
        .select('id, season_id, week_number, predictions_open, predictions_close, live_start, live_end, created_at')
        .eq('season_id', fallbackSeasonId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (weekError) {
        console.error('Error fetching latest game week:', weekError);
      }

      if (latestWeek) {
        setSelectedGameWeek(latestWeek);
        const allWeeks = (await supabase
          .from('game_weeks')
          .select('id, season_id, week_number, predictions_open, predictions_close, live_start, live_end, created_at')
          .eq('season_id', fallbackSeasonId)
          .order('week_number', { ascending: true })).data ?? [];

        setGameWeeks(allWeeks);
      } else {
        const allWeeks = (await supabase
          .from('game_weeks')
          .select('id, season_id, week_number, predictions_open, predictions_close, live_start, live_end, created_at')
          .eq('season_id', fallbackSeasonId)
          .order('week_number', { ascending: true })).data ?? [];

        setGameWeeks(allWeeks);
        setSelectedGameWeek(allWeeks[0] ?? null);
      }

      setLoading(false);
    };

    void initialise();
  }, []);

  useEffect(() => {
    if (!selectedGameWeek) return;

    let active = true;

    const loadStatus = async () => {
      const resolvedStatus = await determineGameWeekStatus(selectedGameWeek);
      if (active) {
        setStatus(resolvedStatus);
      }
    };

    void loadStatus();

    return () => {
      active = false;
    };
  }, [selectedGameWeek]);

  useEffect(() => {
    if (!selectedSeasonId) return;
    void fetchGameWeeksForSeason(selectedSeasonId);
  }, [fetchGameWeeksForSeason, selectedSeasonId]);

  const statusMeta = useMemo(() => {
    switch (status) {
      case 'predictions':
        return { label: 'Predictions open', tone: 'amber', badgeClass: 'text-[#F3C16D]' };
      case 'locked':
        return { label: 'Predictions locked', tone: 'amber', badgeClass: 'text-[#F3C16D]' };
      case 'live':
        return { label: 'Game week live', tone: 'amber', badgeClass: 'text-[#F8D978]' };
      case 'awaiting_scores':
        return { label: 'Awaiting scores', tone: 'purple', badgeClass: 'text-[#C7B8FF]' };
      case 'completed':
        return { label: 'Completed', tone: 'muted', badgeClass: 'text-[#D9E1EA]' };
      case 'upcoming':
        return { label: 'Upcoming', tone: 'blue', badgeClass: 'text-[#88C9FF]' };
      default:
        return { label: 'Loading', tone: 'muted', badgeClass: 'text-[#8A97A6]' };
    }
  }, [status]);

  const countdown = useMemo(() => {
    if (!selectedGameWeek) return 'Loading...';

    const now = currentTime;
    const targets: Record<string, number> = {
      predictions: new Date(selectedGameWeek.predictions_close).getTime(),
      live: new Date(selectedGameWeek.live_end).getTime(),
    };

    const targetTime = status === 'live' ? targets.live : targets.predictions;
    const diff = targetTime - now;

    if (diff <= 0) {
      if (status === 'completed' || status === 'awaiting_scores') {
        return 'Finished';
      }
      return 'Locked';
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    }

    return `${hours}h ${minutes}m`;
  }, [currentTime, selectedGameWeek, status]);

  const openTimeText = useMemo(() => {
    if (!selectedGameWeek) return 'Opening soon';

    const openTime = new Date(selectedGameWeek.predictions_open);
    const formatted = openTime.toLocaleString('en-GB', {
      timeZone: 'Europe/London',
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return formatted.replace(':00 ', ' ').toLowerCase();
  }, [selectedGameWeek]);

  const deadlineText = useMemo(() => {
    if (!selectedGameWeek) return 'Deadline';

    const closeTime = new Date(selectedGameWeek.predictions_close);
    const weekday = closeTime.toLocaleDateString('en-GB', { weekday: 'long' });
    const hour = closeTime.getHours();
    const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
    const period = hour >= 12 ? 'pm' : 'am';

    return `${weekday} ${formattedHour}${period}`;
  }, [selectedGameWeek]);

  const statusSummaryText = (() => {
    switch (status) {
      case 'upcoming':
        return `Opens at ${openTimeText}`;
      case 'predictions':
        return countdown;
      case 'locked':
        return '🔒 Predictions Locked';
      case 'live':
        return '⚽ Games Live now';
      case 'awaiting_scores':
        return '⏳ Scores Coming Soon';
      case 'completed':
        return '✅ Game week complete';
      default:
        return 'Loading...';
    }
  })();

  const statusSummaryColor =
    status === 'upcoming'
      ? '#88C9FF'
      : status === 'predictions' || status === 'locked'
        ? '#F4C76B'
        : status === 'live'
          ? '#B6F23C'
          : status === 'awaiting_scores'
            ? '#C7B8FF'
            : '#D9E1EA';

  const timelineProgress = useMemo(() => {
    if (!selectedGameWeek) return 0;

    const now = currentTime;
    const predOpen = new Date(selectedGameWeek.predictions_open).getTime();
    const predClose = new Date(selectedGameWeek.predictions_close).getTime();

    if (now <= predOpen) return 0;
    if (now >= predClose) return 100;

    const trackDuration = predClose - predOpen;
    const elapsed = now - predOpen;

    return Math.min(100, Math.max(0, (elapsed / trackDuration) * 100));
  }, [currentTime, selectedGameWeek]);

  const liveProgress = useMemo(() => {
    if (!selectedGameWeek) return 0;

    const now = currentTime;
    const liveStart = new Date(selectedGameWeek.live_start).getTime();
    const liveEnd = new Date(selectedGameWeek.live_end).getTime();

    if (now <= liveStart) return 0;
    if (now >= liveEnd) return 100;

    const liveDuration = liveEnd - liveStart;
    const elapsed = now - liveStart;

    return Math.min(100, Math.max(0, (elapsed / liveDuration) * 100));
  }, [currentTime, selectedGameWeek]);

  const isLiveTimeline = status === 'live' || status === 'awaiting_scores' || status === 'completed';
  const progressBarValue = isLiveTimeline ? liveProgress : timelineProgress;
  const progressBarLabels = isLiveTimeline
    ? {
        start: 'Kick Off',
        middle: 'Half Time',
        end: status === 'completed' ? 'Results Locked' : 'Final Whistle',
      }
    : {
        start: 'Open for predictions',
        middle: '',
        end: 'Predictions lock',
      };

  const handleSeasonChange = (seasonId: string) => {
    setSelectedSeasonId(seasonId);
  };

  const handleGameWeekSelect = (gameWeek: GameWeek) => {
    setSelectedGameWeek(gameWeek);
    setShowChooseGameWeek(false);
  };

  if (loading || !selectedGameWeek) {
    return (
      <div
        className="flex min-h-[220px] items-center justify-center rounded-[18px] border"
        style={{
          backgroundColor: colors.panel,
          borderColor: colors.border,
        }}
      >
        <LoadingSpinner size={34} label="Loading game week" />
      </div>
    );
  }

  const nextAction = (() => {
    if (status === 'completed' || status === 'awaiting_scores') {
      return { label: 'My Predictions', tone: 'muted' };
    }

    if (status === 'live') {
      return { label: 'My Predictions', tone: 'live' };
    }

    if (status === 'predictions') {
      return { label: 'My Predictions', tone: 'lime' };
    }

    return { label: 'My Predictions', tone: 'lime' };
  })();

  const statusDeadlineText =
    status === 'upcoming' || status === 'predictions'
      ? `Deadline: ${deadlineText}`
      : status === 'completed'
        ? 'New game week will be announced soon.'
        : 'Deadline: Expired';

  const statusHeaderText =
    status === 'predictions' ? 'Closes in' : status === 'awaiting_scores' ? 'Please wait' : '';

  return (
    <>
      <div
        className="w-full rounded-[18px] border p-4 md:p-5"
        style={{
          backgroundColor: colors.panel,
          borderColor: colors.border,
        }}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowChooseGameWeek(true)}
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-left"
            style={{
              borderColor: colors.borderStrong,
              backgroundColor: colors.field,
            }}
          >
            <span className="text-sm font-medium text-[var(--color-text)] sm:text-base">
              Game Week {selectedGameWeek.week_number}
            </span>
            <span className="text-sm text-[var(--color-muted)]">▾</span>
          </button>

          <div
            className="rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em]"
            style={{
              borderColor: colors.borderStrong,
              backgroundColor: colors.field,
              color:
                status === 'predictions' || status === 'live'
                  ? '#F4C76B'
                  : status === 'completed' || status === 'awaiting_scores'
                    ? '#D9E1EA'
                    : '#8A97A6',
            }}
          >
            {statusMeta.label}
          </div>
        </div>

        <div className="mt-2 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,520px)] lg:items-end">
          <div className="space-y-3">
            <p className="text-[13px] uppercase tracking-[0.16em] text-[var(--color-muted)]">
              {statusHeaderText}
            </p>

            <div className="flex flex-wrap items-baseline gap-2">
              <span
                className={[
                  'font-semibold tracking-[-0.04em]',
                  status === 'predictions' ? 'text-4xl md:text-[40px]' : 'text-[31px] md:text-[34px]',
                ].join(' ')}
                style={{
                  color: statusSummaryColor,
                }}
              >
                {statusSummaryText}
              </span>
            </div>

            <p className="text-[13px] text-[var(--color-muted)]">{statusDeadlineText}</p>
          </div>

          <div className="flex w-full items-end justify-end">
            <div className="w-full">
              <div className="mb-2 flex items-center justify-between text-[13px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
                <span>{progressBarLabels.start}</span>
                {isLiveTimeline && <span>{progressBarLabels.middle}</span>}
                <span>{progressBarLabels.end}</span>
              </div>

              <div
                className="relative h-[6px] overflow-hidden rounded-full"
                style={{ backgroundColor: colors.field, border: `1px solid ${colors.borderStrong}` }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(isLiveTimeline ? 0 : 4, progressBarValue)}%`,
                    background: 'linear-gradient(90deg, #B6F23C 0%, #D7F86F 100%)',
                  }}
                />
              </div>

            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(360px,520px)] lg:gap-8">
          <button
            type="button"
            onClick={() => setActivePanel('view')}
            className="flex h-12 w-full items-center justify-center rounded-xl border px-2 text-sm font-semibold transition-opacity hover:opacity-95 lg:h-[56px] lg:w-[48%] lg:justify-self-start lg:px-4"
            style={{
              backgroundColor: colors.lime,
              borderColor: colors.lime,
              color: '#0B0F14',
            }}
          >
            View Game Week
          </button>

          <button
            type="button"
            onClick={() => setActivePanel('scores')}
            className="flex h-12 w-full items-center justify-center rounded-xl border px-2 text-sm font-semibold transition-opacity hover:opacity-95 lg:h-[56px] lg:w-[48%] lg:justify-self-end lg:px-4"
            style={{
              backgroundColor: colors.lime,
              borderColor: colors.lime,
              color: '#0B0F14',
            }}
          >
            {nextAction.label}
          </button>
        </div>
      </div>

      {activePanel === 'view' && <ViewGameWeek gameWeek={selectedGameWeek} />}
      {activePanel === 'scores' && <EnterScores gameWeek={selectedGameWeek} />}

      <ChooseGameWeekModal
        isOpen={showChooseGameWeek}
        seasons={seasons}
        gameWeeks={gameWeeks}
        selectedSeasonId={selectedSeasonId}
        selectedGameWeekId={selectedGameWeek.id}
        onSeasonChange={handleSeasonChange}
        onSelectGameWeek={handleGameWeekSelect}
        onClose={() => setShowChooseGameWeek(false)}
      />
    </>
  );
}

