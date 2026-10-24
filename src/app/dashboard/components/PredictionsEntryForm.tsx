"use client";

import { FormEvent, useEffect, useState } from 'react';
import { supabase } from '../../../../supabaseClient';
import { FOOTBALL_TEAMS } from '../../../utils/footballTeams';
import { isPlayerEligibleForRound } from '../../../utils/laveryCupEligibility';
import { colors } from '../../stylecomponents/colors';
import type { Fixture, Predictions, SubmitPayload } from './predictionTypes';

type LaveryCupRound = {
  id: string;
  round_number: number;
  round_name: string;
};

type PredictionsEntryFormProps = {
  fixtures: Fixture[];
  initialPredictions: Predictions;
  gameWeekId: string;
  seasonId: string;
  playerId: string;
  onSubmit: (payload: SubmitPayload) => Promise<string | null>;
  onCancel?: () => void;
};

const ALL_TEAMS = [...FOOTBALL_TEAMS['Premier League'], ...FOOTBALL_TEAMS['EFL Championship']].sort();

const inputStyle = { backgroundColor: colors.field, borderColor: colors.borderStrong };
const inputClass =
  'rounded-lg border text-[var(--color-text)] focus:border-transparent focus:outline-2 focus:outline-[var(--color-lime)]';

export default function PredictionsEntryForm({
  fixtures,
  initialPredictions,
  gameWeekId,
  seasonId,
  playerId,
  onSubmit,
  onCancel,
}: PredictionsEntryFormProps) {
  const [predictions, setPredictions] = useState<Predictions>(initialPredictions);
  const [laveryCupRound, setLaveryCupRound] = useState<LaveryCupRound | null>(null);
  const [usedTeams, setUsedTeams] = useState<string[]>([]);
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadLaveryCup = async () => {
      try {
        const { data: roundData, error: roundError } = await supabase
          .from('lavery_cup_rounds')
          .select('id, round_number, round_name')
          .eq('game_week_id', gameWeekId)
          .eq('season_id', seasonId)
          .single();

        if (roundError && roundError.code !== 'PGRST116') {
          console.error('Error fetching Lavery Cup round:', roundError);
        }

        if (!roundData || !(await isPlayerEligibleForRound(roundData, seasonId, playerId))) {
          return;
        }

        const { data: usedTeamsData, error: usedTeamsError } = await supabase
          .from('player_used_teams')
          .select('team_name')
          .eq('player_id', playerId)
          .eq('season_id', seasonId);

        if (usedTeamsError) console.error('Error fetching used teams:', usedTeamsError);

        const { data: existing, error: selectionsError } = await supabase
          .from('lavery_cup_selections')
          .select('team1_name, team2_name')
          .eq('player_id', playerId)
          .eq('round_id', roundData.id)
          .single();

        if (selectionsError && selectionsError.code !== 'PGRST116') {
          console.error('Error fetching existing selections:', selectionsError);
        }

        if (!active) return;
        setLaveryCupRound(roundData);
        setUsedTeams((usedTeamsData ?? []).map((row) => row.team_name));
        if (existing) {
          setTeam1(existing.team1_name);
          setTeam2(existing.team2_name);
        }
      } catch (loadError) {
        console.error('Error loading Lavery Cup data:', loadError);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadLaveryCup();

    return () => {
      active = false;
    };
  }, [gameWeekId, seasonId, playerId]);

  const setScore = (fixtureId: string, side: 'home' | 'away', value: string) => {
    setPredictions((current) => ({
      ...current,
      [fixtureId]: {
        home: current[fixtureId]?.home ?? 0,
        away: current[fixtureId]?.away ?? 0,
        [side]: Math.max(0, parseInt(value, 10) || 0),
      },
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (laveryCupRound && (!team1 || !team2)) {
      setError('Please select two different teams for the Lavery Cup.');
      return;
    }

    setSaving(true);
    setError('');

    const result = await onSubmit({
      scores: predictions,
      laveryCup: laveryCupRound ? { team1, team2, roundId: laveryCupRound.id } : undefined,
    });

    if (result) setError(result);
    setSaving(false);
  };

  const renderTeamSelect = (id: string, label: string, value: string, other: string, onChange: (team: string) => void) => (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs text-[var(--color-muted)]">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        className={`${inputClass} w-full px-3 py-3 text-[15px]`}
        style={inputStyle}
      >
        <option value="">Select a team</option>
        {ALL_TEAMS.map((team) => (
          <option key={team} value={team} disabled={usedTeams.includes(team) || team === other}>
            {team}
            {usedTeams.includes(team) ? ' (Used)' : ''}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-2">
        {fixtures.map((fixture) => (
          <div
            key={fixture.id}
            className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-lg border px-3 py-2 sm:gap-4"
            style={{ backgroundColor: colors.field, borderColor: colors.border }}
          >
            <span className="text-right text-sm text-[var(--color-text)] sm:text-base">{fixture.home_team}</span>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                inputMode="numeric"
                aria-label={`${fixture.home_team} goals`}
                value={predictions[fixture.id]?.home ?? ''}
                onChange={(event) => setScore(fixture.id, 'home', event.target.value)}
                className={`${inputClass} h-10 w-12 text-center`}
                style={{ backgroundColor: colors.panel, borderColor: colors.borderStrong }}
              />
              <span className="text-[var(--color-muted)]">-</span>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                aria-label={`${fixture.away_team} goals`}
                value={predictions[fixture.id]?.away ?? ''}
                onChange={(event) => setScore(fixture.id, 'away', event.target.value)}
                className={`${inputClass} h-10 w-12 text-center`}
                style={{ backgroundColor: colors.panel, borderColor: colors.borderStrong }}
              />
            </div>

            <span className="text-left text-sm text-[var(--color-text)] sm:text-base">{fixture.away_team}</span>
          </div>
        ))}
      </div>

      {laveryCupRound && (
        <div className="mt-6 border-t pt-5" style={{ borderColor: colors.border }}>
          <h3 className="mb-1 text-lg font-semibold text-[var(--color-text)]">
            🏆 Lavery Cup - {laveryCupRound.round_name}
          </h3>
          <p className="mb-4 text-sm text-[var(--color-muted)]">
            Select two teams. If both win this game week you advance to the next round. Teams you have already used
            are unavailable.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {renderTeamSelect('laveryTeam1', 'Team 1', team1, team2, setTeam1)}
            {renderTeamSelect('laveryTeam2', 'Team 2', team2, team1, setTeam2)}
          </div>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border px-3 py-2 text-sm"
          style={{
            backgroundColor: colors.errorBackground,
            borderColor: colors.errorBorder,
            color: colors.errorText,
          }}
        >
          {error}
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 sm:flex sm:justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="h-12 rounded-xl border px-6 text-sm font-semibold text-[var(--color-text)]"
            style={{ borderColor: colors.borderStrong, backgroundColor: colors.field }}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading || saving}
          className={`h-12 rounded-xl px-6 text-sm font-semibold transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70 ${
            onCancel ? '' : 'col-span-2'
          }`}
          style={{ backgroundColor: colors.lime, color: colors.background }}
        >
          {saving ? 'Saving...' : loading ? 'Loading...' : 'Submit predictions'}
        </button>
      </div>
    </form>
  );
}
