"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../../../../supabaseClient';
import { Player } from '../../../types/players';
import { colors } from '../../stylecomponents/colors';

type GameWeekScoresProps = {
  gameWeekId: string;
  seasonId: string;
};

type Fixture = {
  id: string;
  fixture_number: number;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
};

type Prediction = {
  id: string;
  user_id: string;
  fixture_id: string;
  home_prediction: number;
  away_prediction: number;
};

type PlayerResponse = {
  profiles: {
    id: string;
    username: string;
  };
};

const TINTS = {
  result: 'rgba(217, 119, 6, 0.35)',
  score: 'rgba(234, 179, 8, 0.35)',
  goals4: 'rgba(34, 197, 94, 0.35)',
  goals5: 'rgba(168, 85, 247, 0.35)',
  goals6: 'rgba(239, 68, 68, 0.35)',
} as const;

const SELECTED_TINT = 'rgba(182, 242, 60, 0.16)';

const KEY_ITEMS: Array<{ tint: string | null; label: string }> = [
  { tint: null, label: 'Incorrect prediction (0 points)' },
  { tint: TINTS.result, label: 'Correct result (1 point)' },
  { tint: TINTS.score, label: 'Correct score, 0-3 goals (3 points)' },
  { tint: TINTS.goals4, label: 'Correct score, 4 goals (4 points)' },
  { tint: TINTS.goals5, label: 'Correct score, 5 goals (5 points)' },
  { tint: TINTS.goals6, label: 'Correct score, 6+ goals (6+ points)' },
];

const outcome = (home: number, away: number) => (home > away ? 'H' : home < away ? 'A' : 'D');

function getPredictionTint(prediction: Prediction, fixture: Fixture): string | null {
  if (fixture.home_score === null || fixture.away_score === null) return null;

  if (prediction.home_prediction === fixture.home_score && prediction.away_prediction === fixture.away_score) {
    const totalGoals = fixture.home_score + fixture.away_score;
    if (totalGoals >= 6) return TINTS.goals6;
    if (totalGoals === 5) return TINTS.goals5;
    if (totalGoals === 4) return TINTS.goals4;
    return TINTS.score;
  }

  if (outcome(fixture.home_score, fixture.away_score) === outcome(prediction.home_prediction, prediction.away_prediction)) {
    return TINTS.result;
  }

  return null;
}

export default function GameWeekScores({ gameWeekId, seasonId }: GameWeekScoresProps) {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [canViewScores, setCanViewScores] = useState(false);
  const [hostHasEnteredScores, setHostHasEnteredScores] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedFixture, setSelectedFixture] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      setLoading(true);
      setMessage('');
      setSelectedPlayer(null);
      setSelectedFixture(null);

      try {
        const { data: gameWeekData, error: gameWeekError } = await supabase
          .from('game_weeks')
          .select('predictions_close')
          .eq('id', gameWeekId)
          .single();

        if (gameWeekError) throw gameWeekError;

        // Other players' predictions stay hidden until the window closes.
        if (new Date() <= new Date(gameWeekData.predictions_close)) {
          if (!active) return;
          setCanViewScores(false);
          setLoading(false);
          return;
        }

        const { count: scoreCount, error: scoreCountError } = await supabase
          .from('game_week_scores')
          .select('*', { count: 'exact', head: true })
          .eq('game_week_id', gameWeekId);

        if (scoreCountError) {
          console.error('Error checking game week scores:', scoreCountError);
        }

        const { data: fixturesData, error: fixturesError } = await supabase
          .from('fixtures')
          .select('*')
          .eq('game_week_id', gameWeekId)
          .order('fixture_number', { ascending: true });

        if (fixturesError) throw fixturesError;

        const { data: playersData, error: playersError } = await supabase
          .from('season_players')
          .select('profiles (id, username)')
          .eq('season_id', seasonId);

        if (playersError) throw playersError;

        const { data: predictionsData, error: predictionsError } = await supabase
          .from('predictions')
          .select('*')
          .in('fixture_id', fixturesData?.map((fixture) => fixture.id) ?? []);

        if (predictionsError) throw predictionsError;

        if (!active) return;

        setCanViewScores(true);
        setHostHasEnteredScores(scoreCount !== null && scoreCount > 0);
        setFixtures(fixturesData ?? []);
        setPlayers(
          (playersData as unknown as PlayerResponse[]).map((row) => ({
            id: row.profiles.id,
            username: row.profiles.username,
          })),
        );
        setPredictions(predictionsData ?? []);
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        if (!active) return;
        setMessage('Error fetching scores');
        setLoading(false);
      }
    };

    void fetchData();

    return () => {
      active = false;
    };
  }, [gameWeekId, seasonId]);

  const isUniqueCorrectResult = (prediction: Prediction, fixture: Fixture): boolean => {
    if (fixture.home_score === null || fixture.away_score === null) return false;

    const actual = outcome(fixture.home_score, fixture.away_score);
    if (outcome(prediction.home_prediction, prediction.away_prediction) !== actual) return false;

    const sameOutcomeCount = predictions.filter(
      (p) => p.fixture_id === fixture.id && outcome(p.home_prediction, p.away_prediction) === actual,
    ).length;

    return sameOutcomeCount === 1;
  };

  const handlePlayerClick = (playerId: string) => {
    setSelectedPlayer((current) => (current === playerId ? null : playerId));
    setSelectedFixture(null);
  };

  const handleFixtureClick = (fixtureId: string) => {
    setSelectedFixture((current) => (current === fixtureId ? null : fixtureId));
    setSelectedPlayer(null);
  };

  const handleCellClick = (playerId: string, fixtureId: string) => {
    if (selectedPlayer === playerId && selectedFixture === fixtureId) {
      setSelectedPlayer(null);
      setSelectedFixture(null);
    } else {
      setSelectedPlayer(playerId);
      setSelectedFixture(fixtureId);
    }
  };

  if (loading) {
    return <p className="py-10 text-center text-sm text-[var(--color-muted)]">Loading scores...</p>;
  }

  if (message) {
    return <p className="py-10 text-center text-sm" style={{ color: colors.errorText }}>{message}</p>;
  }

  if (!canViewScores) {
    return (
      <p className="py-10 text-center text-sm text-[var(--color-muted)]">
        🔒 Scores will be visible after predictions close.
      </p>
    );
  }

  const headerCell = 'border-b px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.06em]';
  const stickyName = 'sticky left-0 z-10 w-[110px] max-w-[110px] truncate border-b px-3 py-2 text-left text-sm font-medium';

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => setShowKey((current) => !current)}
          className="rounded-full border px-3 py-1.5 text-xs font-medium text-[var(--color-text)]"
          style={{ borderColor: colors.borderStrong, backgroundColor: colors.field }}
        >
          {showKey ? 'Hide key' : '🎨 Colour key'}
        </button>
      </div>

      {showKey && (
        <div
          className="mb-4 grid gap-x-6 gap-y-2 rounded-lg border p-4 text-sm text-[var(--color-muted)] sm:grid-cols-2"
          style={{ backgroundColor: colors.field, borderColor: colors.border }}
        >
          {KEY_ITEMS.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className="h-5 w-5 shrink-0 rounded border"
                style={{ backgroundColor: item.tint ?? 'transparent', borderColor: colors.borderStrong }}
              />
              {item.label}
            </div>
          ))}
          <div className="flex items-center gap-2">
            <span className="w-5 shrink-0 text-center text-base" style={{ color: '#FACC15' }}>★</span>
            Unique correct result (+2 points)
          </div>
          <div className="sm:col-span-2">
            <p className="mb-1 mt-1 font-medium text-[var(--color-text)]">Weekly bonuses</p>
            4 correct scores: +1 point · 5 correct scores: +2 points · 6+ correct scores: +3 points
          </div>
        </div>
      )}

      <div
        className="max-h-[65vh] overflow-auto rounded-lg border"
        style={{ borderColor: colors.border }}
      >
        <table className="min-w-full border-collapse text-[var(--color-text)]">
          <thead className="sticky top-0 z-20">
            <tr>
              <th
                className={`${headerCell} sticky left-0 z-30 text-left`}
                style={{ backgroundColor: colors.panel, borderColor: colors.border }}
              >
                Player
              </th>
              {fixtures.map((fixture) => (
                <th
                  key={fixture.id}
                  onClick={() => handleFixtureClick(fixture.id)}
                  className={`${headerCell} min-w-[96px] cursor-pointer`}
                  style={{
                    backgroundColor: selectedFixture === fixture.id ? '#1F2E14' : colors.panel,
                    borderColor: colors.border,
                  }}
                >
                  {fixture.home_team}
                  <br />
                  <span className="font-normal text-[var(--color-muted)]">vs</span>
                  <br />
                  {fixture.away_team}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr style={{ backgroundColor: colors.background }}>
              <td
                className={stickyName}
                style={{ backgroundColor: colors.background, borderColor: colors.border }}
              >
                Correct scores
              </td>
              {fixtures.map((fixture) => (
                <td
                  key={fixture.id}
                  className="border-b px-3 py-2 text-center text-sm font-semibold"
                  style={{
                    borderColor: colors.border,
                    backgroundColor: selectedFixture === fixture.id ? SELECTED_TINT : undefined,
                    color: colors.lime,
                  }}
                >
                  {hostHasEnteredScores
                    ? fixture.home_score !== null && fixture.away_score !== null
                      ? `${fixture.home_score}-${fixture.away_score}`
                      : '-'
                    : 'Waiting for host'}
                </td>
              ))}
            </tr>

            {players.map((player) => (
              <tr key={player.id}>
                <td
                  onClick={() => handlePlayerClick(player.id)}
                  title={player.username}
                  className={`${stickyName} cursor-pointer`}
                  style={{
                    backgroundColor: selectedPlayer === player.id ? '#1F2E14' : colors.panel,
                    borderColor: colors.border,
                  }}
                >
                  {player.username}
                </td>

                {fixtures.map((fixture) => {
                  const prediction = predictions.find(
                    (p) => p.user_id === player.id && p.fixture_id === fixture.id,
                  );
                  const isHighlighted = selectedPlayer === player.id || selectedFixture === fixture.id;
                  const tint = prediction ? getPredictionTint(prediction, fixture) : null;

                  return (
                    <td
                      key={fixture.id}
                      onClick={() => prediction && handleCellClick(player.id, fixture.id)}
                      className={`relative border-b px-3 py-2 text-center text-sm ${prediction ? 'cursor-pointer' : ''}`}
                      style={{
                        borderColor: colors.border,
                        backgroundColor: isHighlighted ? SELECTED_TINT : tint ?? undefined,
                      }}
                    >
                      {prediction ? `${prediction.home_prediction}-${prediction.away_prediction}` : '-'}
                      {prediction && isUniqueCorrectResult(prediction, fixture) && (
                        <span
                          className="absolute right-1 top-0.5 text-sm font-bold"
                          style={{ color: '#FACC15', WebkitTextStroke: '0.5px #000' }}
                        >
                          ★
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
