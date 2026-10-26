"use client";

import { useState } from 'react';
import { colors } from '../../stylecomponents/colors';
import ChooseSeasonModal, { type Season } from '../components/ChooseSeason';
import { useSeasonStandings } from './useSeasonStandings';

type SortField = 'position' | 'username' | 'correct_scores' | 'points';

type LeagueTablePageProps = {
  seasons: Season[];
  initialSeasonId: string | null;
  onBack: () => void;
};

const COLUMNS: Array<{ field: SortField; label: string; align: 'left' | 'center' }> = [
  { field: 'position', label: 'Pos', align: 'left' },
  { field: 'username', label: 'Player', align: 'left' },
  { field: 'correct_scores', label: 'CS', align: 'center' },
  { field: 'points', label: 'Pts', align: 'center' },
];

export default function LeagueTablePage({ seasons, initialSeasonId, onBack }: LeagueTablePageProps) {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(initialSeasonId);
  const [showChooseSeason, setShowChooseSeason] = useState(false);
  const [sortField, setSortField] = useState<SortField>('position');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { rows, currentUserId, loading } = useSeasonStandings(selectedSeasonId);
  const selectedSeason = seasons.find((season) => season.id === selectedSeasonId) ?? null;

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'position' || field === 'username' ? 'asc' : 'desc');
    }
  };

  const sortedRows = [...rows].sort((a, b) => {
    const modifier = sortDirection === 'asc' ? 1 : -1;
    if (sortField === 'username') return modifier * a.username.localeCompare(b.username);
    return modifier * (a[sortField] - b[sortField]);
  });

  const pillStyle = { borderColor: colors.borderStrong, backgroundColor: colors.field };

  return (
    <>
      <div
        className="w-full rounded-[18px] border p-4 md:p-5"
        style={{ backgroundColor: colors.panel, borderColor: colors.border }}
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
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
            onClick={onBack}
            className="rounded-full border px-3 py-1.5 text-sm font-medium text-[var(--color-text)]"
            style={pillStyle}
          >
            ← Back
          </button>
        </div>

        <h2 className="mb-3 text-lg font-semibold text-[var(--color-text)]">League table</h2>

        {loading ? (
          <p className="py-10 text-center text-sm text-[var(--color-muted)]">Loading standings...</p>
        ) : sortedRows.length === 0 ? (
          <p className="py-10 text-center text-sm text-[var(--color-muted)]">No standings available for this season.</p>
        ) : (
          <div className="max-h-[65vh] overflow-auto rounded-lg border" style={{ borderColor: colors.border }}>
            <table className="min-w-full table-fixed border-collapse text-[var(--color-text)]">
              <thead className="sticky top-0" style={{ backgroundColor: colors.panel }}>
                <tr>
                  {COLUMNS.map((column) => (
                    <th
                      key={column.field}
                      onClick={() => handleSort(column.field)}
                      className={`cursor-pointer border-b px-3 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-muted)] ${
                        column.align === 'center' ? 'text-center' : 'text-left'
                      } ${column.field === 'username' ? 'w-[40%]' : 'w-[20%]'}`}
                      style={{ borderColor: colors.border }}
                    >
                      {column.label}
                      {sortField === column.field && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => {
                  const isMe = row.player_id === currentUserId;

                  return (
                    <tr
                      key={row.player_id}
                      className={isMe ? 'font-semibold' : ''}
                      style={{ backgroundColor: isMe ? '#1F2E14' : undefined, color: isMe ? colors.lime : undefined }}
                    >
                      <td className="border-b px-3 py-3 text-left text-sm" style={{ borderColor: colors.border }}>
                        {row.position}
                      </td>
                      <td className="truncate border-b px-3 py-3 text-left text-sm" style={{ borderColor: colors.border }}>
                        {row.username}
                        {isMe && ' (You)'}
                      </td>
                      <td className="border-b px-3 py-3 text-center text-sm" style={{ borderColor: colors.border }}>
                        {row.correct_scores}
                      </td>
                      <td className="border-b px-3 py-3 text-center text-sm" style={{ borderColor: colors.border }}>
                        {row.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ChooseSeasonModal
        isOpen={showChooseSeason}
        seasons={seasons}
        selectedSeasonId={selectedSeasonId}
        onSelectSeason={(season) => {
          setSelectedSeasonId(season.id);
          setShowChooseSeason(false);
        }}
        onClose={() => setShowChooseSeason(false)}
      />
    </>
  );
}
