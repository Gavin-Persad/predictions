"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../../../../supabaseClient';
import { colors } from '../../stylecomponents/colors';
import type { Season } from '../components/ChooseSeason';

type Round = {
  id: string;
  round_number: number;
  round_name: string;
  is_complete: boolean;
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

type Player = {
  id: string;
  username: string;
};

type LaveryCupProps = {
  season: Season | null;
  seasonLoading?: boolean;
  onOpen: () => void;
};

function OutcomeChip({ team, won }: { team: string; won: boolean | null }) {
  const isMarked = won !== null;

  return (
    <span
      className="inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs"
      style={{
        backgroundColor: isMarked ? (won ? colors.successBackground : colors.errorBackground) : colors.field,
        borderColor: isMarked ? (won ? colors.successBorder : colors.errorBorder) : colors.borderStrong,
        color: isMarked ? (won ? colors.successText : colors.errorText) : colors.text,
      }}
    >
      {isMarked && <span aria-hidden="true">{won ? '✓' : '×'}</span>}
      <span className="truncate">{team}</span>
    </span>
  );
}

export default function LaveryCup({ season, seasonLoading = false, onOpen }: LaveryCupProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [loading, setLoading] = useState(true);
  const seasonId = season?.id ?? null;

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!seasonId) {
        setRounds([]);
        setPlayers([]);
        setSelections([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const [userResult, roundsResult, playersResult] = await Promise.all([
          supabase.auth.getUser(),
          supabase
            .from('lavery_cup_rounds')
            .select('id, round_number, round_name, is_complete')
            .eq('season_id', seasonId)
            .order('round_number', { ascending: true }),
          supabase
            .from('season_players')
            .select('profiles (id, username)')
            .eq('season_id', seasonId),
        ]);

        if (roundsResult.error) throw roundsResult.error;
        if (playersResult.error) throw playersResult.error;

        const mappedPlayers = (playersResult.data ?? []).flatMap((row) => {
          const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
          return profile ? [{ id: profile.id, username: profile.username ?? 'Unknown player' }] : [];
        });
        const mappedRounds = (roundsResult.data ?? []) as Round[];
        const roundIds = mappedRounds.map((round) => round.id);

        const selectionsResult = roundIds.length > 0
          ? await supabase
              .from('lavery_cup_selections')
              .select('id, round_id, player_id, team1_name, team2_name, team1_won, team2_won, advanced')
              .in('round_id', roundIds)
          : { data: [], error: null };

        if (selectionsResult.error) throw selectionsResult.error;
        if (!active) return;

        setCurrentUserId(userResult.data.user?.id ?? null);
        setRounds(mappedRounds);
        setPlayers(mappedPlayers);
        setSelections((selectionsResult.data ?? []) as Selection[]);
      } catch (error) {
        console.error('Error loading Lavery Cup tile:', error);
        if (active) {
          setRounds([]);
          setPlayers([]);
          setSelections([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [seasonId]);

  const playerNameById = new Map(players.map((player) => [player.id, player.username]));
  const roundSelections = new Map<string, Selection[]>();
  selections.forEach((selection) => {
    const items = roundSelections.get(selection.round_id) ?? [];
    items.push(selection);
    roundSelections.set(selection.round_id, items);
  });

  const completedRounds = rounds.filter((round) => round.is_complete);
  const allRoundsComplete = rounds.length > 0 && completedRounds.length === rounds.length;
  let remainingPlayers = new Set(players.map((player) => player.id));

  completedRounds.forEach((round) => {
    const advanced = new Set((roundSelections.get(round.id) ?? []).filter((selection) => selection.advanced).map((selection) => selection.player_id));
    remainingPlayers = new Set([...remainingPlayers].filter((playerId) => advanced.has(playerId)));
  });

  const championId = allRoundsComplete && remainingPlayers.size === 1 ? [...remainingPlayers][0] : null;
  const championName = championId ? playerNameById.get(championId) ?? null : null;
  const currentRound = rounds.find((round) => !round.is_complete) ?? rounds[rounds.length - 1] ?? null;
  const userSelection = currentRound
    ? (roundSelections.get(currentRound.id) ?? []).find((selection) => selection.player_id === currentUserId) ?? null
    : null;
  const isLoading = seasonLoading || loading;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex h-full min-h-[220px] w-full flex-col rounded-[14px] border p-4 text-left transition-colors hover:border-[var(--color-lime)]"
      style={{ backgroundColor: colors.panel, borderColor: colors.border }}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-[var(--color-text)]">Lavery Cup</span>
        {season && <span className="text-xs text-[var(--color-muted)]">{season.name}</span>}
      </span>

      {isLoading ? (
        <span className="flex flex-1 items-center justify-center text-sm text-[var(--color-muted)]">Loading Lavery Cup...</span>
      ) : rounds.length === 0 ? (
        <span className="flex flex-1 items-center justify-center text-center text-sm text-[var(--color-muted)]">Lavery Cup coming soon</span>
      ) : championName ? (
        <span className="flex flex-1 flex-col items-center justify-center text-center">
          <span className="text-3xl" aria-hidden="true">🏆</span>
          <span className="mt-1 text-sm font-semibold text-[var(--color-text)]">
            {championId === currentUserId ? 'You are the champion!' : `${championName} is the champion`}
          </span>
        </span>
      ) : !userSelection ? (
        <span className="flex flex-1 flex-col items-center justify-center text-center">
          <span className="text-sm font-medium text-[var(--color-text)]">
            {currentRound?.round_name ?? 'Lavery Cup'}
          </span>
          <span className="mt-1 text-sm text-amber-300">Selections to be made</span>
        </span>
      ) : (
        <span className="flex flex-1 flex-col justify-center gap-2">
          <span className="text-xs text-[var(--color-muted)]">
            {currentRound?.round_name} · {playerNameById.get(currentUserId ?? '') ?? 'Your selections'}
          </span>
          <span className="flex flex-wrap gap-2">
            <OutcomeChip team={userSelection.team1_name} won={userSelection.team1_won} />
            <OutcomeChip team={userSelection.team2_name} won={userSelection.team2_won} />
          </span>
        </span>
      )}

      <span className="mt-2 block text-center text-sm font-medium" style={{ color: colors.lime }}>
        View full tournament →
      </span>
    </button>
  );
}
