"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../../../../supabaseClient';
import { colors } from '../../stylecomponents/colors';
import type { Season } from '../components/ChooseSeason';

type Player = { id: string; username: string };

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
  is_complete: boolean;
  fixtures: Fixture[];
};

type FixtureScore = {
  player_id: string;
  points: number | null;
  correct_scores: number | null;
};

type GeorgeCupProps = {
  season: Season | null;
  seasonLoading?: boolean;
  onOpen: () => void;
};

function ScoreLabel({ score }: { score: FixtureScore | undefined }) {
  if (!score) return null;

  return (
    <span className="shrink-0 text-right text-xs font-medium text-[var(--color-muted)]">
      {score.points ?? 0}<span className="ml-1 text-[10px]">({score.correct_scores ?? 0})</span>
    </span>
  );
}

export default function GeorgeCup({ season, seasonLoading = false, onOpen }: GeorgeCupProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [scores, setScores] = useState<Map<string, FixtureScore[]>>(new Map());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [displayRoundId, setDisplayRoundId] = useState<string | null>(null);
  const [displayFixtureId, setDisplayFixtureId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const seasonId = season?.id ?? null;

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!seasonId) {
        setPlayers([]);
        setRounds([]);
        setScores(new Map());
        setCurrentUserId(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError(false);

      try {
        const [userResult, playerResult, roundResult] = await Promise.all([
          supabase.auth.getUser(),
          supabase.from('season_players').select('profiles (id, username)').eq('season_id', seasonId),
          supabase
            .from('george_cup_rounds')
            .select('id, round_number, round_name, game_week_id, is_complete, george_cup_fixtures!george_cup_fixtures_round_id_fkey (id, fixture_number, player1_id, player2_id, winner_id)')
            .eq('season_id', seasonId)
            .order('round_number', { ascending: true }),
        ]);

        if (playerResult.error) throw playerResult.error;
        if (roundResult.error) throw roundResult.error;

        const seasonPlayers = (playerResult.data ?? []).flatMap((row) => {
          const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
          return profile ? [{ id: profile.id, username: profile.username ?? 'Unknown player' }] : [];
        });
        const seasonRounds: Round[] = (roundResult.data ?? []).map((round) => ({
          id: round.id,
          round_number: round.round_number,
          round_name: round.round_name,
          game_week_id: round.game_week_id,
          is_complete: round.is_complete,
          fixtures: (round.george_cup_fixtures ?? []).slice().sort((a, b) => a.fixture_number - b.fixture_number),
        }));

        const userId = userResult.data.user?.id ?? null;
        const playerRound = userId
          ? [...seasonRounds].reverse().find((round) => round.fixtures.some((fixture) => fixture.player1_id === userId || fixture.player2_id === userId))
          : null;
        const displayRound = playerRound ?? [...seasonRounds].reverse().find((round) => round.fixtures.length > 0) ?? null;
        const displayFixture = playerRound
          ? playerRound.fixtures.find((fixture) => fixture.player1_id === userId || fixture.player2_id === userId)
          : displayRound?.fixtures[Math.floor(Math.random() * (displayRound.fixtures.length || 1))];

        const gameWeekIds = [...new Set(seasonRounds.map((round) => round.game_week_id).filter((id): id is string => Boolean(id)))];
        const scoreMap = new Map<string, FixtureScore[]>();

        if (gameWeekIds.length > 0) {
          const { data: scoreRows, error: scoreError } = await supabase
            .from('game_week_scores')
            .select('game_week_id, player_id, points, correct_scores')
            .in('game_week_id', gameWeekIds);

          if (scoreError) throw scoreError;
          (scoreRows ?? []).forEach((row) => {
            const entries = scoreMap.get(row.game_week_id) ?? [];
            entries.push({ player_id: row.player_id, points: row.points, correct_scores: row.correct_scores });
            scoreMap.set(row.game_week_id, entries);
          });
        }

        if (!active) return;
        setCurrentUserId(userId);
        setPlayers(seasonPlayers);
        setRounds(seasonRounds);
        setScores(scoreMap);
        setDisplayRoundId(displayRound?.id ?? null);
        setDisplayFixtureId(displayFixture?.id ?? null);
      } catch (error) {
        console.error('Error loading George Cup tile:', error);
        if (active) {
          setPlayers([]);
          setRounds([]);
          setScores(new Map());
          setDisplayRoundId(null);
          setDisplayFixtureId(null);
          setLoadError(true);
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
  const displayRound = rounds.find((round) => round.id === displayRoundId) ?? null;
  const displayFixture = displayRound?.fixtures.find((fixture) => fixture.id === displayFixtureId) ?? null;
  const gameWeekScores = displayRound?.game_week_id ? scores.get(displayRound.game_week_id) ?? [] : [];
  const scoreByPlayer = new Map(gameWeekScores.map((score) => [score.player_id, score]));
  const finalRound = rounds[rounds.length - 1];
  const finalFixture = finalRound?.fixtures.find((fixture) => fixture.winner_id) ?? null;
  const champion = rounds.length > 0 && rounds.every((round) => round.is_complete) && finalRound?.is_complete && finalFixture?.winner_id
    ? playerNameById.get(finalFixture.winner_id) ?? null
    : null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex h-full min-h-[220px] w-full flex-col rounded-[14px] border p-4 text-left transition-colors hover:border-[var(--color-lime)]"
      style={{ backgroundColor: colors.panel, borderColor: colors.border }}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-[var(--color-text)]">George Cup</span>
        {season && <span className="text-xs text-[var(--color-muted)]">{season.name}</span>}
      </span>

      {seasonLoading || loading ? (
        <span className="flex flex-1 items-center justify-center text-sm text-[var(--color-muted)]">Loading George Cup...</span>
      ) : loadError ? (
        <span className="flex flex-1 items-center justify-center text-sm text-[var(--color-muted)]">Could not load George Cup</span>
      ) : rounds.length === 0 ? (
        <span className="flex flex-1 items-center justify-center text-sm text-[var(--color-muted)]">George Cup coming soon</span>
      ) : champion ? (
        <span className="flex flex-1 flex-col items-center justify-center text-center">
          <span className="text-3xl" aria-hidden="true">🏆</span>
          <span className="mt-1 text-sm font-semibold text-[var(--color-text)]">
            {finalFixture?.winner_id === currentUserId ? 'You are the champion!' : `${champion} is the champion`}
          </span>
        </span>
      ) : displayRound && displayFixture ? (
        <span className="flex flex-1 flex-col justify-center gap-2">
          <span className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-[var(--color-text)]">{displayRound.round_name}</span>
            {displayRound.is_complete && <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--color-muted)]">Complete</span>}
          </span>

          {[displayFixture.player1_id, displayFixture.player2_id].map((playerId, side) => {
            const playerName = playerId ? playerNameById.get(playerId) ?? 'Player' : 'BYE';
            const isWinner = Boolean(playerId && displayFixture.winner_id === playerId);
            const isLoser = Boolean(playerId && displayFixture.winner_id && displayFixture.winner_id !== playerId);
            const score = playerId ? scoreByPlayer.get(playerId) : undefined;

            return (
              <span
                key={`${displayFixture.id}-${side}`}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm"
                style={{
                  backgroundColor: displayFixture.winner_id ? (isWinner ? colors.successBackground : colors.errorBackground) : colors.field,
                  color: displayFixture.winner_id ? (isWinner ? colors.successText : colors.errorText) : colors.text,
                }}
              >
                <span className={`truncate ${isLoser ? 'line-through' : ''}`}>
                  {playerId === currentUserId ? `${playerName} (You)` : playerName}
                </span>
                <ScoreLabel score={score} />
              </span>
            );
          })}
        </span>
      ) : (
        <span className="flex flex-1 items-center justify-center text-sm text-[var(--color-muted)]">No fixtures drawn yet</span>
      )}

      <span className="mt-2 block text-center text-sm font-medium" style={{ color: colors.lime }}>
        View full tournament →
      </span>
    </button>
  );
}
