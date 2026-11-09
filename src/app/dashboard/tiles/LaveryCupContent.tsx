"use client";

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { supabase } from '../../../../supabaseClient';
import { colors } from '../../stylecomponents/colors';
import type { Season } from '../components/ChooseSeason';

type LaveryCupContentProps = {
  season: Season;
};

type Player = {
  id: string;
  username: string;
};

type Round = {
  id: string;
  round_number: number;
  round_name: string;
  game_week_id: string | null;
  game_week_number: number | null;
  is_complete: boolean;
  live_start: string | null;
  predictions_close: string | null;
};

type Selection = {
  id: string;
  round_id: string;
  player_id: string;
  team1_name: string;
  team2_name: string;
  team1_won: boolean | null;
  team2_won: boolean | null;
  advanced: boolean;
};

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : format(parsed, 'dd/MM/yy');
}

function TeamChip({ team, result }: { team: string; result: boolean | null }) {
  const isMarked = result !== null;

  return (
    <span
      className="inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs"
      style={{
        backgroundColor: isMarked ? (result ? colors.successBackground : colors.errorBackground) : colors.field,
        borderColor: isMarked ? (result ? colors.successBorder : colors.errorBorder) : colors.borderStrong,
        color: isMarked ? (result ? colors.successText : colors.errorText) : colors.text,
      }}
    >
      {isMarked && <span aria-hidden="true">{result ? '✓' : '×'}</span>}
      <span className="truncate">{team}</span>
    </span>
  );
}

export default function LaveryCupContent({ season }: LaveryCupContentProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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
            .from('lavery_cup_rounds')
            .select('id, round_number, round_name, game_week_id, is_complete')
            .eq('season_id', season.id)
            .order('round_number', { ascending: true }),
        ]);

        if (playersResult.error) throw playersResult.error;
        if (roundsResult.error) throw roundsResult.error;

        const mappedPlayers = (playersResult.data ?? []).flatMap((row) => {
          const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
          return profile ? [{ id: profile.id, username: profile.username ?? 'Unknown player' }] : [];
        });
        const roundRows = roundsResult.data ?? [];
        const gameWeekIds = [...new Set(roundRows.map((round) => round.game_week_id).filter((id): id is string => Boolean(id)))];

        const gameWeekResult = gameWeekIds.length > 0
          ? await supabase.from('game_weeks').select('id, week_number, live_start, predictions_close').in('id', gameWeekIds)
          : { data: [], error: null };

        if (gameWeekResult.error) throw gameWeekResult.error;

        const gameWeeks = new Map((gameWeekResult.data ?? []).map((week) => [week.id, week]));
        const mappedRounds: Round[] = roundRows.map((round) => {
          const gameWeek = round.game_week_id ? gameWeeks.get(round.game_week_id) : null;
          return {
            ...round,
            game_week_number: gameWeek?.week_number ?? null,
            live_start: gameWeek?.live_start ?? null,
            predictions_close: gameWeek?.predictions_close ?? null,
          };
        });

        const roundIds = mappedRounds.map((round) => round.id);
        const selectionResult = roundIds.length > 0
          ? await supabase
              .from('lavery_cup_selections')
              .select('id, round_id, player_id, team1_name, team2_name, team1_won, team2_won, advanced')
              .in('round_id', roundIds)
          : { data: [], error: null };

        if (selectionResult.error) throw selectionResult.error;
        if (!active) return;

        setCurrentUserId(userResult.data.user?.id ?? null);
        setPlayers(mappedPlayers);
        setRounds(mappedRounds);
        setSelections((selectionResult.data ?? []) as Selection[]);
        const initialRound = mappedRounds.find((round) => !round.is_complete) ?? mappedRounds[mappedRounds.length - 1] ?? null;
        setSelectedRoundId(initialRound?.id ?? null);
      } catch (loadError) {
        console.error('Error loading Lavery Cup:', loadError);
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

  const playerNameById = useMemo(() => new Map(players.map((player) => [player.id, player.username])), [players]);
  const selectionsByRound = useMemo(() => {
    const grouped = new Map<string, Selection[]>();
    selections.forEach((selection) => {
      const current = grouped.get(selection.round_id) ?? [];
      current.push(selection);
      grouped.set(selection.round_id, current);
    });
    return grouped;
  }, [selections]);
  const currentRound = rounds.find((round) => round.id === selectedRoundId) ?? null;

  const roundCounts = useMemo(() => {
    const totalPlayers = players.length;
    let remaining = new Set(players.map((player) => player.id));

    return rounds.map((round) => {
      const hasStarted = round.is_complete || Boolean(round.game_week_id);
      const entered = hasStarted ? remaining.size : 0;
      const advanced = new Set(
        (selectionsByRound.get(round.id) ?? [])
          .filter((selection) => selection.advanced && remaining.has(selection.player_id))
          .map((selection) => selection.player_id),
      );
      const through = round.is_complete ? advanced.size : 0;
      const eliminated = round.is_complete ? Math.max(0, entered - through) : 0;
      const notYetEntered = Math.max(0, totalPlayers - entered);

      if (round.is_complete) remaining = advanced;

      return { roundId: round.id, roundName: round.round_name, entered, through, eliminated, notYetEntered };
    });
  }, [players, rounds, selectionsByRound]);

  const survivors = useMemo(() => {
    let remaining = new Set(players.map((player) => player.id));
    rounds.filter((round) => round.is_complete).forEach((round) => {
      const advanced = new Set((selectionsByRound.get(round.id) ?? []).filter((selection) => selection.advanced).map((selection) => selection.player_id));
      remaining = new Set([...remaining].filter((playerId) => advanced.has(playerId)));
    });
    return [...remaining];
  }, [players, rounds, selectionsByRound]);

  const championId = rounds.length > 0 && rounds.every((round) => round.is_complete) && survivors.length === 1 ? survivors[0] : null;
  const championName = championId ? playerNameById.get(championId) ?? null : null;
  const currentRoundSelections = useMemo(
    () => (currentRound ? selectionsByRound.get(currentRound.id) ?? [] : []),
    [currentRound, selectionsByRound],
  );
  const selectionByPlayer = useMemo(
    () => new Map(currentRoundSelections.map((selection) => [selection.player_id, selection])),
    [currentRoundSelections],
  );
  const isRoundComplete = Boolean(currentRound?.is_complete);
  const roundPlayers = useMemo(() => {
    const active = new Set(players.map((player) => player.id));
    if (!currentRound) return active;

    rounds.filter((round) => round.is_complete && round.round_number < currentRound.round_number).forEach((round) => {
      const advanced = new Set((selectionsByRound.get(round.id) ?? []).filter((selection) => selection.advanced).map((selection) => selection.player_id));
      [...active].forEach((playerId) => {
        if (!advanced.has(playerId)) active.delete(playerId);
      });
    });
    return active;
  }, [players, currentRound, rounds, selectionsByRound]);

  const throughPlayers = useMemo(() => {
    if (!currentRound || !isRoundComplete) return players.filter((player) => roundPlayers.has(player.id));
    return players.filter((player) => roundPlayers.has(player.id) && Boolean(selectionByPlayer.get(player.id)?.advanced));
  }, [players, currentRound, isRoundComplete, roundPlayers, selectionByPlayer]);

  const eliminatedPlayers = useMemo(() => {
    if (!currentRound || !isRoundComplete) return [];
    return players.filter((player) => roundPlayers.has(player.id) && !selectionByPlayer.get(player.id)?.advanced);
  }, [players, currentRound, isRoundComplete, roundPlayers, selectionByPlayer]);

  const selectionsLocked = currentRound?.predictions_close
    ? Date.now() >= new Date(currentRound.predictions_close).getTime()
    : Boolean(currentRound?.is_complete);
  const totalPlayers = players.length;
  const resultsDate = formatDate(currentRound?.live_start ?? null);

  function formatDate(value: string | null): string | null {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : format(date, 'dd/MM/yy');
  }

  function renderPlayerRow(player: Player, eliminated: boolean) {
    const selection = selectionByPlayer.get(player.id);

    return (
      <div key={player.id} className="flex flex-wrap items-center justify-between gap-3 border-t py-3 first:border-t-0" style={{ borderColor: colors.border }}>
        <span className={`min-w-[110px] text-sm font-medium ${player.id === currentUserId ? 'text-[var(--color-lime)]' : 'text-[var(--color-text)]'}`}>
          {player.username}{player.id === currentUserId && ' (You)'}
        </span>

        {!selectionsLocked ? (
          <span className="text-xs italic text-[var(--color-muted)]">Selections hidden until predictions close</span>
        ) : selection ? (
          <span className="flex flex-wrap gap-2">
            <TeamChip team={selection.team1_name} result={isRoundComplete ? selection.team1_won : null} />
            <TeamChip team={selection.team2_name} result={isRoundComplete ? selection.team2_won : null} />
          </span>
        ) : (
          <span className={`text-xs italic ${eliminated ? 'text-[var(--color-muted)]' : 'text-amber-300'}`}>No selections made</span>
        )}
      </div>
    );
  }

  return (
    <>
      {loading ? (
        <p className="py-10 text-center text-sm text-[var(--color-muted)]">Loading Lavery Cup...</p>
      ) : error ? (
        <p className="py-10 text-center text-sm text-[var(--color-muted)]">Could not load Lavery Cup details.</p>
      ) : rounds.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--color-muted)]">Lavery Cup coming soon.</p>
      ) : (
        <div className="space-y-4">
          {championName && (
            <section className="relative flex items-center gap-4 overflow-hidden rounded-[14px] border p-4 sm:p-5" style={{ backgroundColor: colors.panel, borderColor: 'rgba(217, 180, 74, 0.5)', backgroundImage: 'radial-gradient(ellipse at 0% 0%, rgba(217, 180, 74, 0.14), transparent 60%)' }}>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(217, 180, 74, 0.16)', color: '#D9B44A' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
                  <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
                  <path d="M8 6H5v2a4 4 0 0 0 4 4M16 6h3v2a4 4 0 0 1-4 4M12 13v4m-3 3h6m-5-3h4" />
                </svg>
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: '#D9B44A' }}>Champion</p>
                <p className="mt-0.5 text-lg font-semibold text-[var(--color-text)]">{championName}</p>
              </div>
            </section>
          )}

          <section className="rounded-[14px] border p-4" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
            <h2 className="mb-3 text-sm font-semibold text-[var(--color-text)]">Players remaining</h2>
            <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[var(--color-muted)]">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ backgroundColor: colors.lime }} />Through</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ backgroundColor: colors.errorText }} />Out</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ backgroundColor: '#34404D' }} />Out in earlier rounds</span>
            </div>
            <div className="space-y-2">
              {roundCounts.map((item) => (
                <div key={item.roundId} className="grid grid-cols-[minmax(90px,130px)_minmax(0,1fr)_3.5rem] items-center gap-2">
                  <span className="truncate text-xs text-[var(--color-muted)]">{item.roundName}</span>
                  <span className="flex h-2 overflow-hidden rounded-full" style={{ backgroundColor: colors.background }} aria-label={`${item.through} of ${item.entered} progressed; ${item.eliminated} eliminated; ${item.notYetEntered} out in previous rounds`}>
                    {totalPlayers > 0 && <span className="h-full shrink-0" style={{ width: `${(item.through / totalPlayers) * 100}%`, backgroundColor: colors.lime }} />}
                    {totalPlayers > 0 && <span className="h-full shrink-0" style={{ width: `${(item.eliminated / totalPlayers) * 100}%`, backgroundColor: colors.errorText }} />}
                    {totalPlayers > 0 && <span className="h-full shrink-0" style={{ width: `${(item.notYetEntered / totalPlayers) * 100}%`, backgroundColor: '#34404D' }} />}
                  </span>
                  <span className="text-right text-xs font-medium text-[var(--color-text)]">{item.through}/{item.entered}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Lavery Cup rounds">
            {rounds.map((round) => {
              const selected = round.id === selectedRoundId;
              return (
                <button key={round.id} type="button" role="tab" aria-selected={selected} onClick={() => setSelectedRoundId(round.id)} className="rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors" style={{ backgroundColor: selected ? colors.lime : colors.field, borderColor: selected ? colors.lime : colors.borderStrong, color: selected ? colors.background : colors.text }}>
                  {round.round_name}
                </button>
              );
            })}
          </div>

          {currentRound && (
            <>
              <section className="rounded-[14px] border p-4" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
                {isRoundComplete ? (
                  <p className="text-sm text-[var(--color-muted)]">
                    {resultsDate && <>Game week starting {resultsDate} · </>}
                    <span className="font-medium text-[var(--color-text)]">{throughPlayers.length} through</span>
                    {' · '}
                    <span className="font-medium text-[var(--color-text)]">{eliminatedPlayers.length} out</span>
                  </p>
                ) : (
                  <p className="text-sm text-[var(--color-muted)]">
                    {currentRound.game_week_number
                      ? `${currentRound.round_name} waiting for Game Week ${currentRound.game_week_number} results`
                      : `${currentRound.round_name} is waiting for a game week to be assigned`}
                  </p>
                )}
              </section>

              {!isRoundComplete && !selectionsLocked && (
                <p className="text-xs text-[var(--color-muted)]">Players’ selections stay hidden until predictions close.</p>
              )}

              <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-[14px] border p-4" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
                  <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.06em]" style={{ color: colors.successText }}>
                    <span aria-hidden="true">✓</span> Through <span className="text-xs font-normal text-[var(--color-muted)]">{throughPlayers.length}</span>
                  </h2>
                  {throughPlayers.length > 0 ? throughPlayers.map((player) => renderPlayerRow(player, false)) : <p className="py-5 text-sm text-[var(--color-muted)]">No players through this round yet.</p>}
                </section>

                <section className="rounded-[14px] border p-4" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
                  <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.06em]" style={{ color: colors.errorText }}>
                    <span aria-hidden="true">×</span> Eliminated <span className="text-xs font-normal text-[var(--color-muted)]">{eliminatedPlayers.length}</span>
                  </h2>
                  {eliminatedPlayers.length > 0 ? eliminatedPlayers.map((player) => renderPlayerRow(player, true)) : <p className="py-5 text-sm text-[var(--color-muted)]">{isRoundComplete ? 'No players eliminated in this round.' : 'No eliminations yet.'}</p>}
                </section>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
