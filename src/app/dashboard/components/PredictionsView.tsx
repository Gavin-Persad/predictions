"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../../../../supabaseClient';
import { isPlayerEligibleForRound } from '../../../utils/laveryCupEligibility';
import { calculatePoints, calculateWeeklyCorrectScoreBonus } from '../../../utils/scoreCalculator';
import { colors } from '../../stylecomponents/colors';
import type { Fixture, Predictions } from './predictionTypes';

type PredictionsViewProps = {
  fixtures: Fixture[];
  predictions: Predictions;
  gameWeekId: string;
  seasonId: string;
  playerId: string;
  isPast: boolean;
  showBreakdown: boolean;
  canEdit: boolean;
  onEdit: () => void;
};

type LaveryCupRound = {
  id: string;
  round_number: number;
  round_name: string;
};

type LaveryCupSelection = {
  team1_name: string;
  team2_name: string;
  team1_won: boolean | null;
  team2_won: boolean | null;
  advanced: boolean;
};

const outcome = (home: number, away: number) => (home > away ? 'H' : home < away ? 'A' : 'D');

function TeamResult({ won }: { won: boolean | null }) {
  if (won === null) return null;

  return (
    <span className="ml-2 text-xs font-semibold" style={{ color: won ? colors.successText : colors.errorText }}>
      {won ? '(Won)' : '(Lost)'}
    </span>
  );
}

export default function PredictionsView({
  fixtures,
  predictions,
  gameWeekId,
  seasonId,
  playerId,
  isPast,
  showBreakdown,
  canEdit,
  onEdit,
}: PredictionsViewProps) {
  const [laveryCupRound, setLaveryCupRound] = useState<LaveryCupRound | null>(null);
  const [laveryCupSelection, setLaveryCupSelection] = useState<LaveryCupSelection | null>(null);
  const [uniqueResults, setUniqueResults] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;

    const loadLaveryCup = async () => {
      const { data: roundData, error: roundError } = await supabase
        .from('lavery_cup_rounds')
        .select('id, round_number, round_name')
        .eq('game_week_id', gameWeekId)
        .single();

      if (roundError && roundError.code !== 'PGRST116') {
        console.error('Error fetching Lavery Cup round:', roundError);
      }

      if (!roundData || !active) return;

      const eligible = isPast || (await isPlayerEligibleForRound(roundData, seasonId, playerId));
      if (!eligible) return;

      const { data: selection, error: selectionError } = await supabase
        .from('lavery_cup_selections')
        .select('team1_name, team2_name, team1_won, team2_won, advanced')
        .eq('player_id', playerId)
        .eq('round_id', roundData.id)
        .single();

      if (selectionError && selectionError.code !== 'PGRST116') {
        console.error('Error fetching Lavery Cup selection:', selectionError);
      }

      if (!active) return;
      setLaveryCupRound(roundData);
      setLaveryCupSelection(selection ?? null);
    };

    void loadLaveryCup();

    return () => {
      active = false;
    };
  }, [gameWeekId, seasonId, playerId, isPast]);

  useEffect(() => {
    if (!showBreakdown || fixtures.length === 0) return;

    let active = true;

    const loadUniqueResults = async () => {
      const { data, error } = await supabase
        .from('predictions')
        .select('fixture_id, home_prediction, away_prediction')
        .in('fixture_id', fixtures.map((fixture) => fixture.id));

      if (error || !data) {
        console.error('Error fetching predictions:', error);
        return;
      }

      const unique: Record<string, boolean> = {};

      fixtures.forEach((fixture) => {
        const mine = predictions[fixture.id];
        if (!mine || fixture.home_score === null || fixture.away_score === null) return;

        const actual = outcome(fixture.home_score, fixture.away_score);
        if (outcome(mine.home, mine.away) !== actual) return;

        const sameOutcome = data.filter(
          (row) => row.fixture_id === fixture.id && outcome(row.home_prediction, row.away_prediction) === actual,
        ).length;

        if (sameOutcome === 1) unique[fixture.id] = true;
      });

      if (active) setUniqueResults(unique);
    };

    void loadUniqueResults();

    return () => {
      active = false;
    };
  }, [showBreakdown, fixtures, predictions]);

  const fixtureResults = fixtures.map((fixture) => {
    const mine = predictions[fixture.id];

    if (!showBreakdown || !mine || fixture.home_score === null || fixture.away_score === null) {
      return { fixture, mine, base: 0, bonus: 0 };
    }

    const base = calculatePoints(
      { home_prediction: mine.home, away_prediction: mine.away },
      { home_score: fixture.home_score, away_score: fixture.away_score },
    );

    return { fixture, mine, base, bonus: base > 0 && uniqueResults[fixture.id] ? 2 : 0 };
  });

  const baseAndUniqueTotal = fixtureResults.reduce((sum, item) => sum + item.base + item.bonus, 0);
  const correctScoreCount = fixtureResults.filter((item) => item.base >= 3).length;
  const weeklyBonus = calculateWeeklyCorrectScoreBonus(correctScoreCount);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Your predictions</h2>

        {canEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="h-10 rounded-xl px-4 text-sm font-semibold transition-opacity hover:opacity-95"
            style={{ backgroundColor: colors.lime, color: colors.background }}
          >
            Edit predictions
          </button>
        )}
      </div>

      <div className="space-y-2">
        {fixtureResults.map(({ fixture, mine, base, bonus }) => (
          <div
            key={fixture.id}
            className="rounded-lg border px-3 py-2"
            style={{ backgroundColor: colors.field, borderColor: colors.border }}
          >
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
              <span className="text-right text-sm text-[var(--color-text)] sm:text-base">{fixture.home_team}</span>
              <span className="min-w-[56px] text-center font-semibold text-[var(--color-text)]">
                {mine ? `${mine.home} - ${mine.away}` : <span className="text-xs font-normal text-[var(--color-muted)]">No prediction</span>}
              </span>
              <span className="text-left text-sm text-[var(--color-text)] sm:text-base">{fixture.away_team}</span>
            </div>

            {base > 0 && (
              <p className="mt-1 text-center text-xs text-[var(--color-muted)]">
                {base} {base === 1 ? 'point' : 'points'}
                {bonus > 0 && (
                  <span style={{ color: colors.successText }}> + {bonus} unique result bonus</span>
                )}
                {bonus > 0 && ` = ${base + bonus}`}
              </p>
            )}
          </div>
        ))}
      </div>

      {showBreakdown && (
        <div
          className="mt-5 rounded-lg border p-4 text-sm"
          style={{ backgroundColor: colors.field, borderColor: colors.border }}
        >
          <h3 className="mb-3 text-base font-semibold text-[var(--color-text)]">Score breakdown</h3>

          <div className="space-y-2">
            <div className="flex justify-between text-[var(--color-muted)]">
              <span>Base and unique points</span>
              <span className="text-[var(--color-text)]">{baseAndUniqueTotal}</span>
            </div>

            {weeklyBonus > 0 && (
              <div className="flex justify-between text-[var(--color-muted)]">
                <span>Weekly bonus ({correctScoreCount} correct scores)</span>
                <span style={{ color: colors.successText }}>+{weeklyBonus}</span>
              </div>
            )}

            <div
              className="flex justify-between border-t pt-2 font-semibold text-[var(--color-text)]"
              style={{ borderColor: colors.border }}
            >
              <span>Total</span>
              <span style={{ color: colors.lime }}>{baseAndUniqueTotal + weeklyBonus}</span>
            </div>
          </div>
        </div>
      )}

      {laveryCupRound && laveryCupSelection && (
        <div className="mt-5 border-t pt-5" style={{ borderColor: colors.border }}>
          <h3 className="mb-3 text-lg font-semibold text-[var(--color-text)]">
            🏆 Lavery Cup - {laveryCupRound.round_name}
          </h3>

          <div
            className="rounded-lg border p-4"
            style={{ backgroundColor: colors.field, borderColor: colors.border }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-[var(--color-muted)]">Team 1</p>
                <p className="font-semibold text-[var(--color-text)]">
                  {laveryCupSelection.team1_name}
                  {isPast && <TeamResult won={laveryCupSelection.team1_won} />}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-muted)]">Team 2</p>
                <p className="font-semibold text-[var(--color-text)]">
                  {laveryCupSelection.team2_name}
                  {isPast && <TeamResult won={laveryCupSelection.team2_won} />}
                </p>
              </div>
            </div>

            {isPast && (
              <p className="mt-4 border-t pt-3 text-sm font-medium text-[var(--color-text)]" style={{ borderColor: colors.border }}>
                Status:{' '}
                {laveryCupSelection.team1_won === null && laveryCupSelection.team2_won === null ? (
                  <span style={{ color: '#88C9FF' }}>Waiting on results</span>
                ) : laveryCupSelection.advanced ? (
                  <span style={{ color: colors.successText }}>Advanced to next round</span>
                ) : (
                  <span style={{ color: colors.errorText }}>Eliminated</span>
                )}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
