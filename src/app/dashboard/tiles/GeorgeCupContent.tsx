"use client";

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { supabase } from '../../../../supabaseClient';
import { colors } from '../../stylecomponents/colors';
import type { Season } from '../components/ChooseSeason';

type GeorgeCupContentProps = {
  season: Season;
};

type Player = {
  id: string;
  username: string;
};

type Fixture = {
  id: string;
  fixture_number: number;
  player1_id: string | null;
  player2_id: string | null;
  winner_id: string | null;
};

type Round = {
  id: string;
  round_number: number;
  round_name: string;
  game_week_id: string | null;
  game_week_number: number | null;
  game_week_start: string | null;
  is_complete: boolean;
  status: string;
  fixtures: Fixture[];
};

type PlayerScore = {
  player_id: string;
  points: number | null;
  correct_scores: number | null;
};

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : format(date, 'dd/MM/yy');
}

function TrophyIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 6H5v2a4 4 0 0 0 4 4M16 6h3v2a4 4 0 0 1-4 4M12 13v4m-3 3h6m-5-3h4" />
    </svg>
  );
}

function PlayerScoreLine({
  player,
  score,
  isCurrentUser,
  state,
}: {
  player: Player | null;
  score: PlayerScore | undefined;
  isCurrentUser: boolean;
  state: 'neutral' | 'winner' | 'loser' | 'bye';
}) {
  const tone = state === 'winner'
    ? colors.lime
    : state === 'loser'
      ? colors.errorText
      : colors.muted;

  return (
    <div
      className="flex min-w-0 items-center justify-between gap-3 rounded-lg px-3 py-2.5"
      style={{
        backgroundColor: state === 'winner' ? '#172015' : state === 'loser' ? colors.errorBackground : colors.field,
        borderLeft: state === 'winner' ? `3px solid ${colors.lime}` : state === 'loser' ? `3px solid ${colors.errorText}` : '3px solid transparent',
      }}
    >
      <span className={`min-w-0 truncate text-sm ${state === 'winner' || isCurrentUser ? 'font-semibold' : ''}`} style={{ color: isCurrentUser ? colors.text : tone }}>
        {state === 'winner' && <span className="mr-2" style={{ color: colors.lime }}>✓</span>}
        {state === 'loser' && <span className="mr-2">×</span>}
        {player?.username ?? 'BYE'}
        {isCurrentUser && <span className="ml-1 text-xs" style={{ color: colors.lime }}>(You)</span>}
      </span>
      {score && (
        <span className="shrink-0 tabular-nums text-right">
          <span className="text-lg font-semibold text-[var(--color-text)]">{score.points ?? 0}</span>
          <span className="ml-1 text-xs text-[var(--color-muted)]">({score.correct_scores ?? 0})</span>
        </span>
      )}
    </div>
  );
}

export default function GeorgeCupContent({ season }: GeorgeCupContentProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(false);

      try {
        const [userResult, playersResult, roundsResult] = await Promise.all([
          supabase.auth.getUser(),
          supabase.from('season_players').select('profiles (id, username)').eq('season_id', season.id),
          supabase
            .from('george_cup_rounds')
            .select('id, round_number, round_name, game_week_id, is_complete, status, george_cup_fixtures!george_cup_fixtures_round_id_fkey (id, fixture_number, player1_id, player2_id, winner_id)')
            .eq('season_id', season.id)
            .order('round_number', { ascending: true }),
        ]);

        if (playersResult.error) throw playersResult.error;
        if (roundsResult.error) throw roundsResult.error;

        const mappedPlayers = (playersResult.data ?? []).flatMap((row) => {
          const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
          return profile ? [{ id: profile.id, username: profile.username ?? 'Unknown player' }] : [];
        });
        const rawRounds = roundsResult.data ?? [];
        const gameWeekIds = [...new Set(rawRounds.map((round) => round.game_week_id).filter((id): id is string => Boolean(id)))];
        const gameWeeksResult = gameWeekIds.length > 0
          ? await supabase.from('game_weeks').select('id, week_number, live_start').in('id', gameWeekIds)
          : { data: [], error: null };

        if (gameWeeksResult.error) throw gameWeeksResult.error;
        const gameWeeksById = new Map((gameWeeksResult.data ?? []).map((week) => [week.id, week]));
        const mappedRounds: Round[] = rawRounds.map((round) => {
          const gameWeek = round.game_week_id ? gameWeeksById.get(round.game_week_id) : null;
          return {
            id: round.id,
            round_number: round.round_number,
            round_name: round.round_name,
            game_week_id: round.game_week_id,
            game_week_number: gameWeek?.week_number ?? null,
            game_week_start: gameWeek?.live_start ?? null,
            is_complete: round.is_complete,
            status: round.status,
            fixtures: (round.george_cup_fixtures ?? []).slice().sort((a, b) => a.fixture_number - b.fixture_number),
          };
        });

        if (!active) return;

        setPlayers(mappedPlayers);
        setRounds(mappedRounds);
        setCurrentUserId(userResult.data.user?.id ?? null);
        const initialRound = [...mappedRounds].reverse().find((round) => round.game_week_id || round.fixtures.length > 0)
          ?? mappedRounds[mappedRounds.length - 1]
          ?? null;
        setSelectedRoundId(initialRound?.id ?? null);
      } catch (loadError) {
        console.error('Error loading George Cup:', loadError);
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [season.id]);

  const selectedRound = rounds.find((round) => round.id === selectedRoundId) ?? null;

  useEffect(() => {
    let active = true;

    const loadScores = async () => {
      setScores([]);
      if (!selectedRound?.game_week_id) return;

      setScoresLoading(true);
      const { data, error: scoresError } = await supabase
        .from('game_week_scores')
        .select('player_id, points, correct_scores')
        .eq('game_week_id', selectedRound.game_week_id);

      if (!active) return;
      if (scoresError) {
        console.error('Error loading George Cup game week scores:', scoresError);
      } else {
        setScores((data ?? []) as PlayerScore[]);
      }
      setScoresLoading(false);
    };

    void loadScores();
    return () => {
      active = false;
    };
  }, [selectedRound]);

  const playerNameById = useMemo(() => new Map(players.map((player) => [player.id, player.username])), [players]);
  const scoresByPlayer = useMemo(() => new Map(scores.map((score) => [score.player_id, score])), [scores]);
  const finalRound = rounds[rounds.length - 1] ?? null;
  const finalWinnerFixture = finalRound?.fixtures.find((fixture) => fixture.winner_id) ?? null;
  const championId = rounds.length > 0 && rounds.every((round) => round.is_complete) ? finalWinnerFixture?.winner_id ?? null : null;
  const championName = championId ? playerNameById.get(championId) ?? null : null;

  const userFixtureHistory = rounds.flatMap((round) => round.fixtures
    .filter((fixture) => fixture.player1_id === currentUserId || fixture.player2_id === currentUserId)
    .map((fixture) => ({ round, fixture })));
  const latestUserFixture = userFixtureHistory[userFixtureHistory.length - 1] ?? null;
  const currentUserLost = Boolean(latestUserFixture?.round.is_complete && latestUserFixture.fixture.winner_id && latestUserFixture.fixture.winner_id !== currentUserId);
  const currentUserHasUpcomingFixture = Boolean(latestUserFixture && !latestUserFixture.round.is_complete);
  const userAdvanced = Boolean(latestUserFixture?.round.is_complete && latestUserFixture.fixture.winner_id === currentUserId);
  const nextRound = latestUserFixture
    ? rounds.find((round) => round.round_number > latestUserFixture.round.round_number)
    : null;

  let userStatus = 'Not yet drawn, wait for later rounds';
  let userStatusBadge = rounds.some((round) => !round.is_complete) ? 'In progress' : 'Not drawn';
  let userStatusDetail: string | null = null;

  if (championName && championId === currentUserId) {
    userStatus = 'You are the George Cup champion!';
    userStatusBadge = 'Champion';
    userStatusDetail = 'Champions! Champions! Olé! Olé! Olé!';
  } else if (currentUserLost && latestUserFixture) {
    userStatus = `Knocked out in ${latestUserFixture.round.round_name}`;
    userStatusBadge = 'Eliminated';
    userStatusDetail = 'Better luck next year.';
  } else if (currentUserHasUpcomingFixture && latestUserFixture) {
    userStatus = `Round: ${latestUserFixture.round.round_name}`;
    userStatusBadge = 'In progress';
    const opponentId = latestUserFixture.fixture.player1_id === currentUserId
      ? latestUserFixture.fixture.player2_id
      : latestUserFixture.fixture.player1_id;
    userStatusDetail = opponentId
      ? `You are playing ${playerNameById.get(opponentId) ?? 'your opponent'}`
      : 'You have a bye this round.';
  } else if (userAdvanced) {
    userStatus = `Through to ${nextRound?.round_name ?? 'the next round'}`;
    userStatusBadge = 'Still in';
    userStatusDetail = `${nextRound?.round_name ?? 'Next round'} draw coming soon.`;
  } else if (rounds.length > 0 && rounds.every((round) => round.is_complete) && championName) {
    userStatus = `${championName} won the George Cup`;
    userStatusBadge = 'Complete';
    userStatusDetail = `Congratulations to ${championName}.`;
  }

  const getPlayer = (playerId: string | null): Player | null => playerId ? players.find((player) => player.id === playerId) ?? null : null;

  const roundDate = formatDate(selectedRound?.game_week_start ?? null);
  const roundStateLabel = selectedRound?.is_complete ? 'Complete' : selectedRound?.game_week_id ? 'In progress' : 'Not drawn';

  const pillStyle = { borderColor: colors.borderStrong, backgroundColor: colors.field };

  return (
    <div className="w-full rounded-[18px] border p-4 md:p-5" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
      {loading ? (
        <p className="py-10 text-center text-sm text-[var(--color-muted)]">Loading George Cup...</p>
      ) : error ? (
        <p className="py-10 text-center text-sm text-[var(--color-muted)]">Could not load George Cup details.</p>
      ) : rounds.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--color-muted)]">George Cup coming soon.</p>
      ) : (
        <div className="space-y-4">
          {championName && (
            <section className="relative flex items-center gap-4 overflow-hidden rounded-[14px] border p-4 sm:p-5" style={{ backgroundColor: colors.panel, borderColor: 'rgba(217, 180, 74, 0.5)', backgroundImage: 'radial-gradient(ellipse at 0% 0%, rgba(217, 180, 74, 0.14), transparent 60%)' }}>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(217, 180, 74, 0.16)', color: '#D9B44A' }}>
                <TrophyIcon />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: '#D9B44A' }}>Champion</p>
                <p className="mt-0.5 text-lg font-semibold text-[var(--color-text)]">{championName}</p>
              </div>
            </section>
          )}

          <section className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border p-4" style={{ backgroundColor: colors.field, borderColor: colors.border }}>
            <div>
              <p className="text-xs uppercase tracking-[0.06em] text-[var(--color-muted)]">Your cup</p>
              <p className="mt-1 text-base font-semibold text-[var(--color-text)]">{userStatus}</p>
              {userStatusDetail && <p className="mt-1 text-sm text-[var(--color-muted)]">{userStatusDetail}</p>}
            </div>
            <span
              className="rounded-full border px-3 py-1 text-xs font-medium"
              style={{
                backgroundColor: userStatusBadge === 'Eliminated' ? colors.errorBackground : userStatusBadge === 'Still in' || userStatusBadge === 'Champion' ? colors.successBackground : colors.field,
                borderColor: userStatusBadge === 'Eliminated' ? colors.errorBorder : userStatusBadge === 'Still in' || userStatusBadge === 'Champion' ? colors.successBorder : colors.borderStrong,
                color: userStatusBadge === 'Eliminated' ? colors.errorText : userStatusBadge === 'Still in' || userStatusBadge === 'Champion' ? colors.successText : colors.muted,
              }}
            >
              {userStatusBadge}
            </span>
          </section>

          <div className="flex flex-wrap gap-2" role="tablist" aria-label="George Cup rounds">
            {rounds.map((round) => {
              const selected = round.id === selectedRoundId;
              const locked = !round.game_week_id && !round.fixtures.some((fixture) => fixture.player1_id || fixture.player2_id);
              return (
                <button
                  key={round.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setSelectedRoundId(round.id)}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors"
                  style={{ backgroundColor: selected ? colors.lime : colors.field, borderColor: selected ? colors.lime : colors.borderStrong, color: selected ? colors.background : locked ? colors.muted : colors.text }}
                >
                  {locked && <span aria-hidden="true">🔒</span>}
                  {round.round_name}
                </button>
              );
            })}
          </div>

          {selectedRound && (
            <>
              <div className="space-y-1">
                <p className="text-sm text-[var(--color-muted)]">
                  {selectedRound.game_week_id
                    ? <>Game week starting {roundDate ?? 'TBD'} · <span className={selectedRound.is_complete ? 'text-emerald-400' : 'text-[var(--color-text)]'}>{roundStateLabel}</span></>
                    : `${selectedRound.round_name} · ${roundStateLabel}`}
                </p>
                <p className="text-xs text-[var(--color-muted)]">Points, then correct scores in brackets</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {selectedRound.fixtures.filter((fixture) => fixture.player1_id || fixture.player2_id).map((fixture) => {
                  const winnerId = selectedRound.is_complete ? fixture.winner_id : null;
                  const player1 = getPlayer(fixture.player1_id);
                  const player2 = getPlayer(fixture.player2_id);
                  const winnerScore = winnerId ? scoresByPlayer.get(winnerId) : undefined;
                  const loserId = winnerId === fixture.player1_id ? fixture.player2_id : fixture.player1_id;
                  const loserScore = loserId ? scoresByPlayer.get(loserId) : undefined;
                  const resultLabel = !winnerId
                    ? null
                    : winnerScore && loserScore && winnerScore.points !== loserScore.points
                      ? 'Won on points'
                      : winnerScore && loserScore && winnerScore.correct_scores !== loserScore.correct_scores
                        ? 'Level on points, won on correct scores'
                        : 'Won on coin toss';

                  return (
                    <section key={fixture.id} className="rounded-[14px] border p-1.5" style={{ backgroundColor: colors.field, borderColor: colors.border }}>
                      <PlayerScoreLine player={player1} score={fixture.player1_id ? scoresByPlayer.get(fixture.player1_id) : undefined} isCurrentUser={fixture.player1_id === currentUserId} state={!fixture.player1_id ? 'bye' : winnerId ? winnerId === fixture.player1_id ? 'winner' : 'loser' : 'neutral'} />
                      <p className="py-1 text-center text-[10px] uppercase tracking-[0.12em] text-[var(--color-placeholder)]">vs</p>
                      <PlayerScoreLine player={player2} score={fixture.player2_id ? scoresByPlayer.get(fixture.player2_id) : undefined} isCurrentUser={fixture.player2_id === currentUserId} state={!fixture.player2_id ? 'bye' : winnerId ? winnerId === fixture.player2_id ? 'winner' : 'loser' : 'neutral'} />
                      {resultLabel && (
                        <p className="px-3 pb-1 pt-2 text-xs text-[var(--color-muted)]">
                          {resultLabel}
                        </p>
                      )}
                    </section>
                  );
                })}
              </div>

              {selectedRound.fixtures.length === 0 && (
                <div className="flex items-center gap-3 rounded-[14px] border border-dashed p-4 text-sm text-[var(--color-muted)]" style={{ borderColor: colors.borderStrong }}>
                  <span className="text-xl" aria-hidden="true">◷</span>
                  <div>
                    <p className="font-medium text-[var(--color-text)]">{selectedRound.round_name}</p>
                    <p>Drawn once the previous round is complete.</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
