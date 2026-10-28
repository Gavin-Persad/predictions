"use client";

import { useMemo, useRef, useState } from 'react';
import { colors } from '../../stylecomponents/colors';
import ChooseMonthModal from '../components/ChooseMonth';
import ChooseSeasonModal, { type Season } from '../components/ChooseSeason';
import { loadManagerMonthStandings, type ManagerMonthStandings } from './managerMonthData';

type ManagerOfTheMonthPageProps = {
  seasons: Season[];
  initialSeasonId: string;
  months: ManagerMonthStandings[];
  initialMonthId: string;
  currentUserId: string | null;
  onBack: () => void;
};

const columns = [
  { key: 'position', label: 'Pos' },
  { key: 'username', label: 'Player' },
  { key: 'correct_scores', label: 'CS' },
  { key: 'points', label: 'Pts' },
] as const;

export default function ManagerOfTheMonthPage({
  seasons,
  initialSeasonId,
  months: initialMonths,
  initialMonthId,
  currentUserId,
  onBack,
}: ManagerOfTheMonthPageProps) {
  const [selectedSeasonId, setSelectedSeasonId] = useState(initialSeasonId);
  const [months, setMonths] = useState(initialMonths);
  const [selectedMonthId, setSelectedMonthId] = useState(initialMonthId);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [showChooseSeason, setShowChooseSeason] = useState(false);
  const [showChooseMonth, setShowChooseMonth] = useState(false);
  const latestRequest = useRef(0);

  const selectedSeason = seasons.find((season) => season.id === selectedSeasonId) ?? null;
  const selectedData = useMemo(
    () => months.find((entry) => entry.month.id === selectedMonthId) ?? months[0],
    [months, selectedMonthId],
  );
  const monthWithScores = months.find((entry) => entry.scores.length > 0);
  const isViewingCurrentScoredMonth = selectedData?.month.id === monthWithScores?.month.id;

  const handleSelectSeason = async (season: Season) => {
    setShowChooseSeason(false);
    if (season.id === selectedSeasonId) return;

    const requestId = ++latestRequest.current;
    setSelectedSeasonId(season.id);
    setLoading(true);
    setLoadError(false);

    try {
      const standings = await loadManagerMonthStandings(season.id);
      if (requestId !== latestRequest.current) return;

      // Open on the newest month with scores, or the first month before any scores are in.
      const startMonth = standings.find((entry) => entry.scores.length > 0) ?? standings[standings.length - 1];
      setMonths(standings);
      setSelectedMonthId(startMonth?.month.id ?? '');
    } catch (error) {
      console.error('Error loading manager months:', error);
      if (requestId !== latestRequest.current) return;

      setMonths([]);
      setSelectedMonthId('');
      setLoadError(true);
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  };

  const pillStyle = { borderColor: colors.borderStrong, backgroundColor: colors.field };

  return (
    <div
      className="w-full rounded-[18px] border p-4 md:p-5"
      style={{ backgroundColor: colors.panel, borderColor: colors.border }}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowChooseSeason(true)}
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-left"
            style={pillStyle}
          >
            <span className="text-sm font-medium text-[var(--color-text)] sm:text-base">
              {selectedSeason ? selectedSeason.name : 'Choose season'}
            </span>
            <span className="text-sm text-[var(--color-muted)]">▾</span>
          </button>

          <button
            type="button"
            onClick={() => setShowChooseMonth(true)}
            disabled={months.length === 0}
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-left disabled:opacity-60"
            style={pillStyle}
          >
            <span className="text-sm font-medium text-[var(--color-text)] sm:text-base">
              {selectedData ? selectedData.month.month_label : 'Choose month'}
            </span>
            <span className="text-sm text-[var(--color-muted)]">▾</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="rounded-full border px-3 py-1.5 text-sm font-medium text-[var(--color-text)]"
          style={pillStyle}
        >
          ← Back
        </button>
      </div>

      <h2 className="mb-4 text-lg font-semibold text-[var(--color-text)]">Manager of the Month</h2>

      {loading ? (
        <p className="py-8 text-center text-sm text-[var(--color-muted)]">Loading...</p>
      ) : loadError ? (
        <p className="py-8 text-center text-sm text-[var(--color-muted)]">
          Could not load the manager months. Please try again.
        </p>
      ) : !selectedData ? (
        <p className="py-8 text-center text-sm text-[var(--color-muted)]">No manager months are set up for this season.</p>
      ) : (
        <>
          <section className="mb-4 rounded-lg border p-4" style={{ backgroundColor: colors.field, borderColor: colors.border }}>
            <h3 className="mb-2 text-sm font-semibold text-[var(--color-text)]">Included game weeks</h3>
            {selectedData.includedWeeks.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedData.includedWeeks.map((week) => (
                  <span
                    key={week.id}
                    className="rounded-full border px-2.5 py-1 text-xs text-[var(--color-muted)]"
                    style={{ borderColor: colors.borderStrong, backgroundColor: colors.background }}
                  >
                    Week {week.week_number}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-muted)]">No game weeks assigned to this month.</p>
            )}
          </section>

          <section className="rounded-lg border p-4" style={{ backgroundColor: colors.field, borderColor: colors.border }}>
            <h3 className="mb-3 text-sm font-semibold text-[var(--color-text)]">
              Manager of the Month: {selectedData.month.month_label}
            </h3>

            {selectedData.scores.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--color-muted)]">No scores yet for this month.</p>
            ) : (
              <div className="max-h-[65vh] overflow-auto rounded-lg border" style={{ borderColor: colors.border }}>
                <table className="min-w-full table-fixed border-collapse text-[var(--color-text)]">
                  <thead className="sticky top-0" style={{ backgroundColor: colors.panel }}>
                    <tr>
                      {columns.map((column) => (
                        <th
                          key={column.key}
                          className={`border-b px-3 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-muted)] ${column.key === 'username' ? 'w-[50%] text-left' : column.key === 'position' ? 'w-[15%] text-left' : 'w-[17.5%] text-center'}`}
                          style={{ borderColor: colors.border }}
                        >
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedData.scores.map((score) => {
                      const isMe = score.player_id === currentUserId;
                      const isLeader = isViewingCurrentScoredMonth && score.position === 1;

                      return (
                        <tr
                          key={score.player_id}
                          className={isMe || isLeader ? 'font-semibold' : ''}
                          style={{
                            backgroundColor: isMe ? '#1F2E14' : undefined,
                            color: isMe ? colors.lime : undefined,
                          }}
                        >
                          <td className="border-b px-3 py-3 text-left text-sm" style={{ borderColor: colors.border }}>
                            {isLeader ? '🏆' : score.position}
                          </td>
                          <td className="truncate border-b px-3 py-3 text-left text-sm" style={{ borderColor: colors.border }}>
                            {score.username}{isMe && ' (You)'}
                          </td>
                          <td className="border-b px-3 py-3 text-center text-sm" style={{ borderColor: colors.border }}>
                            {score.correct_scores}
                          </td>
                          <td className="border-b px-3 py-3 text-center text-sm" style={{ borderColor: colors.border }}>
                            {score.points}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      <ChooseSeasonModal
        isOpen={showChooseSeason}
        seasons={seasons}
        selectedSeasonId={selectedSeasonId}
        onSelectSeason={handleSelectSeason}
        onClose={() => setShowChooseSeason(false)}
      />

      <ChooseMonthModal
        isOpen={showChooseMonth}
        months={months.map(({ month }) => ({ id: month.id, month_label: month.month_label }))}
        selectedMonthId={selectedData?.month.id ?? null}
        onSelectMonth={(monthId) => {
          setSelectedMonthId(monthId);
          setShowChooseMonth(false);
        }}
        onClose={() => setShowChooseMonth(false)}
      />
    </div>
  );
}
