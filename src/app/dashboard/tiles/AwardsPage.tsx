"use client";

import { useEffect, useMemo, useState } from 'react';
import ChooseSeasonModal, { type Season } from '../components/ChooseSeason';
import { colors } from '../../stylecomponents/colors';
import { loadAwardWinners, type AwardWinner } from './awardData';

type AwardsPageProps = {
  seasons: Season[];
  initialSeasonId: string;
  onBack: () => void;
};

function winnerText(award: AwardWinner): string {
  if (award.winner_names.length > 0) return award.winner_names.join(', ');
  return award.winner_name ?? '—';
}

function prizeText(prize: number | null): string {
  return prize == null ? '—' : `£${prize.toFixed(2)}`;
}

export default function AwardsPage({ seasons, initialSeasonId, onBack }: AwardsPageProps) {
  const [selectedSeasonId, setSelectedSeasonId] = useState(initialSeasonId);
  const [awards, setAwards] = useState<AwardWinner[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showChooseSeason, setShowChooseSeason] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(false);

    const load = async () => {
      try {
        const data = await loadAwardWinners(selectedSeasonId);
        if (active) setAwards(data);
      } catch (error) {
        console.error('Error loading award winners:', error);
        if (active) {
          setAwards([]);
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
  }, [selectedSeasonId]);

  const selectedSeason = seasons.find((season) => season.id === selectedSeasonId) ?? null;
  const league = useMemo(
    () => awards.filter((award) => award.category === 'league_position').sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    [awards],
  );
  const cups = useMemo(() => awards.filter((award) => award.category === 'cup'), [awards]);
  const managerMonths = useMemo(
    () => awards.filter((award) => award.category === 'motm').sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0)),
    [awards],
  );
  const specialAwards = useMemo(() => awards.filter((award) => award.category === 'special'), [awards]);
  const cupGroups = useMemo(() => [...new Set(cups.map((award) => award.group_key ?? ''))], [cups]);
  const pillStyle = { borderColor: colors.borderStrong, backgroundColor: colors.field };

  const renderAwardRow = (award: AwardWinner, label: string) => (
    <div
      key={award.id}
      className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] items-center gap-3 rounded-lg border px-3 py-2.5 text-sm"
      style={{ backgroundColor: colors.field, borderColor: colors.border }}
    >
      <span className="text-[var(--color-muted)]">{label}</span>
      <span className="break-words text-[var(--color-text)]">{winnerText(award)}</span>
      <span className="text-right font-medium text-[var(--color-lime)]">{prizeText(award.prize)}</span>
    </div>
  );

  return (
    <div className="w-full rounded-[18px] border p-4 md:p-5" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setShowChooseSeason(true)}
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-left"
          style={pillStyle}
        >
          <span className="text-sm font-medium text-[var(--color-text)] sm:text-base">
            {selectedSeason?.name ?? 'Choose season'}
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

      <h2 className="mb-4 text-lg font-semibold text-[var(--color-text)]">Award winners</h2>

      {loading ? (
        <p className="py-10 text-center text-sm text-[var(--color-muted)]">Loading awards...</p>
      ) : loadError ? (
        <p className="py-10 text-center text-sm text-[var(--color-muted)]">Could not load awards for this season.</p>
      ) : awards.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--color-muted)]">No awards configured for this season.</p>
      ) : (
        <div className="space-y-5">
          {league.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-[var(--color-text)]">League table</h3>
              <div className="space-y-2">
                {league.map((award) => renderAwardRow(award, `${award.position ?? '—'}${award.position === 1 ? 'st' : award.position === 2 ? 'nd' : award.position === 3 ? 'rd' : 'th'} place`))}
              </div>
            </section>
          )}

          {cupGroups.map((group) => {
            const groupAwards = cups.filter((award) => (award.group_key ?? '') === group);
            return (
              <section key={group || 'cup'}>
                <h3 className="mb-2 text-sm font-semibold text-[var(--color-text)]">{group || 'Cups'}</h3>
                <div className="space-y-2">
                  {groupAwards.map((award) => renderAwardRow(award, award.sub_type?.replaceAll('_', ' ') ?? 'Winner'))}
                </div>
              </section>
            );
          })}

          {managerMonths.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-[var(--color-text)]">Manager of the Month</h3>
              <div className="space-y-2">
                {managerMonths.map((award) => renderAwardRow(award, award.group_key ?? 'Month'))}
              </div>
            </section>
          )}

          {specialAwards.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-[var(--color-text)]">Special awards</h3>
              <div className="space-y-2">
                {specialAwards.map((award) => (
                  <div key={award.id}>
                    {renderAwardRow(award, award.group_key ?? 'Award')}
                    {award.note && (
                      <p className="px-3 py-2 text-xs text-[var(--color-muted)]">{award.note}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

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
    </div>
  );
}
