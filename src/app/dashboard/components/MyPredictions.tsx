"use client";

import { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../../../supabaseClient';
import { determineGameWeekStatus, type GameWeekStatus } from '../../../utils/gameWeekStatus';
import { formatUkDayTime } from '../../../utils/formatUkTime';
import { colors } from '../../stylecomponents/colors';
import LoadingSpinner from '../../stylecomponents/loading';
import ChooseGameWeekModal from './ChooseGameWeek';
import GameWeekProgressBar from './GameWeekProgressBar';
import PredictionsEntryForm from './PredictionsEntryForm';
import PredictionsView from './PredictionsView';
import type { Fixture, Predictions, SubmitPayload } from './predictionTypes';

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

type MyPredictionsProps = {
  gameWeek: GameWeek;
  onBack: () => void;
};

const GAME_WEEK_COLUMNS =
  'id, season_id, week_number, predictions_open, predictions_close, live_start, live_end, created_at';

function formatCountdown(targetIso: string, now: number): string {
  const diff = new Date(targetIso).getTime() - now;
  if (diff <= 0) return '0m';

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return days > 0 ? `${days}d ${hours}h ${minutes}m` : `${hours}h ${minutes}m`;
}

export default function MyPredictions({ gameWeek, onBack }: MyPredictionsProps) {
  const initialWeekId = gameWeek.id;

  const [userId, setUserId] = useState<string | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [allWeeks, setAllWeeks] = useState<GameWeek[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<GameWeek | null>(null);
  const [modalSeasonId, setModalSeasonId] = useState<string | null>(null);
  const [showChooseGameWeek, setShowChooseGameWeek] = useState(false);
  const [status, setStatus] = useState<GameWeekStatus | null>(null);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [predictions, setPredictions] = useState<Predictions>({});
  const [isEditing, setIsEditing] = useState(false);
  const [initialising, setInitialising] = useState(true);
  const [loadingWeek, setLoadingWeek] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;

    const initialise = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        if (active) setInitialising(false);
        return;
      }

      const { data: memberships, error: membershipError } = await supabase
        .from('season_players')
        .select('season_id')
        .eq('player_id', user.id);

      if (membershipError) console.error('Error fetching player seasons:', membershipError);

      const seasonIds = (memberships ?? []).map((row) => row.season_id);

      if (seasonIds.length === 0) {
        if (active) {
          setUserId(user.id);
          setInitialising(false);
        }
        return;
      }

      const [{ data: seasonData }, { data: weekData }] = await Promise.all([
        supabase.from('seasons').select('id, name').in('id', seasonIds).order('created_at', { ascending: false }),
        supabase.from('game_weeks').select(GAME_WEEK_COLUMNS).in('season_id', seasonIds).order('week_number', { ascending: true }),
      ]);

      if (!active) return;

      const playerSeasons: Season[] = seasonData ?? [];
      const weeks: GameWeek[] = weekData ?? [];

      // Prefer the week opened from the dashboard; otherwise the newest week in the player's newest season.
      const newestSeasonWeeks = weeks
        .filter((week) => week.season_id === playerSeasons[0]?.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const startingWeek = weeks.find((week) => week.id === initialWeekId) ?? newestSeasonWeeks[0] ?? null;

      setUserId(user.id);
      setSeasons(playerSeasons);
      setAllWeeks(weeks);
      setSelectedWeek(startingWeek);
      setModalSeasonId(startingWeek?.season_id ?? playerSeasons[0]?.id ?? null);
      setInitialising(false);
    };

    void initialise();

    return () => {
      active = false;
    };
  }, [initialWeekId]);

  useEffect(() => {
    if (!selectedWeek) return;

    let active = true;
    setStatus(null);

    const loadStatus = async () => {
      const resolved = await determineGameWeekStatus(selectedWeek);
      if (active) setStatus(resolved);
    };

    void loadStatus();

    return () => {
      active = false;
    };
  }, [selectedWeek]);

  useEffect(() => {
    if (!selectedWeek || !userId) return;

    let active = true;

    const loadWeek = async () => {
      setLoadingWeek(true);
      setIsEditing(false);
      setFixtures([]);
      setPredictions({});

      const { data: fixtureData } = await supabase
        .from('fixtures')
        .select('*')
        .eq('game_week_id', selectedWeek.id)
        .order('fixture_number');

      const weekFixtures: Fixture[] = fixtureData ?? [];

      const { data: predictionData } = weekFixtures.length
        ? await supabase
            .from('predictions')
            .select('fixture_id, home_prediction, away_prediction')
            .in('fixture_id', weekFixtures.map((fixture) => fixture.id))
            .eq('user_id', userId)
        : { data: [] };

      if (!active) return;

      const mine: Predictions = {};
      (predictionData ?? []).forEach((row: { fixture_id: string; home_prediction: number; away_prediction: number }) => {
        mine[row.fixture_id] = { home: row.home_prediction, away: row.away_prediction };
      });

      setFixtures(weekFixtures);
      setPredictions(mine);
      setLoadingWeek(false);
    };

    void loadWeek();

    return () => {
      active = false;
    };
  }, [selectedWeek, userId]);

  const modalWeeks = useMemo(
    () => allWeeks.filter((week) => week.season_id === modalSeasonId),
    [allWeeks, modalSeasonId],
  );

  const handleSubmitPredictions = async (data: SubmitPayload): Promise<string | null> => {
    if (!selectedWeek || !userId) return 'Something went wrong. Please refresh and try again.';

    const nowMs = Date.now();
    if (
      nowMs < new Date(selectedWeek.predictions_open).getTime() ||
      nowMs > new Date(selectedWeek.predictions_close).getTime()
    ) {
      return 'Predictions are not open for this game week.';
    }

    const rows = Object.entries(data.scores).map(([fixtureId, score]) => ({
      user_id: userId,
      fixture_id: fixtureId,
      home_prediction: score.home,
      away_prediction: score.away,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('predictions').upsert(rows, { onConflict: 'user_id,fixture_id' });

    if (error) {
      console.error('Error upserting predictions:', error);
      return 'Could not save your predictions. Please try again.';
    }

    if (data.laveryCup) {
      const { team1, team2, roundId } = data.laveryCup;
      const seasonId = selectedWeek.season_id;

      const { data: existing, error: checkError } = await supabase
        .from('lavery_cup_selections')
        .select('id, team1_name, team2_name')
        .eq('player_id', userId)
        .eq('round_id', roundId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing selections:', checkError);
        return 'Predictions saved, but your Lavery Cup picks could not be saved. Please try again.';
      }

      const selection = { team1_name: team1, team2_name: team2, team1_won: null, team2_won: null, advanced: false };

      if (existing) {
        await supabase
          .from('player_used_teams')
          .delete()
          .eq('player_id', userId)
          .eq('season_id', seasonId)
          .in('team_name', [existing.team1_name, existing.team2_name]);

        const { error: updateError } = await supabase
          .from('lavery_cup_selections')
          .update(selection)
          .eq('id', existing.id);

        if (updateError) {
          console.error('Error updating Lavery Cup selections:', updateError);
          return 'Predictions saved, but your Lavery Cup picks could not be saved. Please try again.';
        }
      } else {
        const { error: insertError } = await supabase
          .from('lavery_cup_selections')
          .insert({ id: uuidv4(), round_id: roundId, player_id: userId, ...selection });

        if (insertError) {
          console.error('Error saving Lavery Cup selections:', insertError);
          return 'Predictions saved, but your Lavery Cup picks could not be saved. Please try again.';
        }
      }

      const { error: teamsError } = await supabase.from('player_used_teams').upsert(
        [team1, team2].map((teamName) => ({
          id: uuidv4(),
          season_id: seasonId,
          player_id: userId,
          team_name: teamName,
        })),
        { onConflict: 'season_id,player_id,team_name' },
      );

      if (teamsError) {
        console.error('Error tracking used teams:', teamsError);
        return 'Predictions saved, but your Lavery Cup picks could not be saved. Please try again.';
      }
    }

    setPredictions(data.scores);
    setIsEditing(false);
    return null;
  };

  const pillStyle = { borderColor: colors.borderStrong, backgroundColor: colors.field };

  const renderStrip = () => {
    if (!selectedWeek || !status) return null;

    let label = '';
    let headline = '';
    let color = '#F4C76B';
    let headlineClass = 'text-3xl md:text-[34px]';
    let showBar = false;

    switch (status) {
      case 'predictions':
        label = 'Closes in';
        headline = formatCountdown(selectedWeek.predictions_close, now);
        showBar = true;
        break;
      case 'locked':
        headline = '🔒 Predictions locked';
        headlineClass = 'text-2xl md:text-[28px]';
        showBar = true;
        break;
      case 'live':
        label = 'Final whistle in';
        headline = formatCountdown(selectedWeek.live_end, now);
        color = colors.lime;
        showBar = true;
        break;
      case 'upcoming':
        headline = `Upcoming: games start at ${formatUkDayTime(selectedWeek.live_start)}`;
        color = '#88C9FF';
        headlineClass = 'text-xl md:text-2xl';
        break;
      case 'awaiting_scores':
        headline = '⏳ Scores coming soon';
        color = '#C7B8FF';
        headlineClass = 'text-2xl md:text-[28px]';
        break;
      default:
        return null;
    }

    return (
      <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,520px)] lg:items-end lg:gap-8">
        <div>
          {label && (
            <p className="mb-1 text-[13px] uppercase tracking-[0.16em] text-[var(--color-muted)]">{label}</p>
          )}
          <p className={`font-semibold tracking-[-0.02em] ${headlineClass}`} style={{ color }}>
            {headline}
          </p>
        </div>

        {showBar && <GameWeekProgressBar gameWeek={selectedWeek} status={status} now={now} />}
      </div>
    );
  };

  const renderBody = () => {
    if (!selectedWeek) {
      return <p className="py-10 text-center text-sm text-[var(--color-muted)]">No game weeks found.</p>;
    }

    if (!status || loadingWeek) {
      return (
        <div className="flex justify-center py-10">
          <LoadingSpinner size={34} label="Loading predictions" />
        </div>
      );
    }

    if (status === 'upcoming') return null;

    if (fixtures.length === 0) {
      return <p className="py-6 text-center text-sm text-[var(--color-muted)]">No fixtures have been added yet.</p>;
    }

    const isOpen = status === 'predictions';

    if (isOpen && (isEditing || Object.keys(predictions).length === 0)) {
      return (
        <PredictionsEntryForm
          key={selectedWeek.id}
          fixtures={fixtures}
          initialPredictions={predictions}
          gameWeekId={selectedWeek.id}
          seasonId={selectedWeek.season_id}
          playerId={userId ?? ''}
          onSubmit={handleSubmitPredictions}
          onCancel={isEditing ? () => setIsEditing(false) : undefined}
        />
      );
    }

    return (
      <PredictionsView
        key={selectedWeek.id}
        fixtures={fixtures}
        predictions={predictions}
        gameWeekId={selectedWeek.id}
        seasonId={selectedWeek.season_id}
        playerId={userId ?? ''}
        isPast={status === 'awaiting_scores' || status === 'completed'}
        showBreakdown={status === 'completed'}
        canEdit={isOpen}
        onEdit={() => setIsEditing(true)}
      />
    );
  };

  const hasSeasons = seasons.length > 0;

  return (
    <>
      <div
        className="w-full rounded-[18px] border p-4 md:p-5"
        style={{ backgroundColor: colors.panel, borderColor: colors.border }}
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          {hasSeasons && selectedWeek ? (
            <button
              type="button"
              onClick={() => setShowChooseGameWeek(true)}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-left"
              style={pillStyle}
            >
              <span className="text-sm font-medium text-[var(--color-text)] sm:text-base">
                Game Week {selectedWeek.week_number}
              </span>
              <span className="text-sm text-[var(--color-muted)]">▾</span>
            </button>
          ) : (
            <h2 className="text-lg font-semibold text-[var(--color-text)]">My Predictions</h2>
          )}

          <button
            type="button"
            onClick={onBack}
            className="rounded-full border px-3 py-1.5 text-sm font-medium text-[var(--color-text)]"
            style={pillStyle}
          >
            ← Back
          </button>
        </div>

        {initialising ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner size={34} label="Loading predictions" />
          </div>
        ) : !hasSeasons ? (
          <p className="py-8 text-center text-sm text-[var(--color-muted)]">
            You are not registered for any seasons. If you would like to take part please contact{' '}
            <a href="mailto:gavinapersad@gmail.com" className="underline" style={{ color: colors.lime }}>
              gavinapersad@gmail.com
            </a>
            .
          </p>
        ) : (
          <>
            {renderStrip()}
            {renderBody()}
          </>
        )}
      </div>

      <ChooseGameWeekModal
        isOpen={showChooseGameWeek}
        seasons={seasons}
        gameWeeks={modalWeeks}
        selectedSeasonId={modalSeasonId}
        selectedGameWeekId={selectedWeek?.id ?? null}
        onSeasonChange={setModalSeasonId}
        onSelectGameWeek={(week) => {
          setSelectedWeek(week);
          setModalSeasonId(week.season_id);
          setShowChooseGameWeek(false);
        }}
        onClose={() => setShowChooseGameWeek(false)}
      />
    </>
  );
}
