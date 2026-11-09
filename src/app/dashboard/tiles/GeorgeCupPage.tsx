"use client";

import { useState } from 'react';
import { colors } from '../../stylecomponents/colors';
import ChooseSeasonModal, { type Season } from '../components/ChooseSeason';
import GeorgeCupContent from './GeorgeCupContent';

type GeorgeCupPageProps = {
  seasons: Season[];
  initialSeasonId: string;
  onBack: () => void;
};

export default function GeorgeCupPage({ seasons, initialSeasonId, onBack }: GeorgeCupPageProps) {
  const [selectedSeasonId, setSelectedSeasonId] = useState(initialSeasonId);
  const [showChooseSeason, setShowChooseSeason] = useState(false);
  const season = seasons.find((item) => item.id === selectedSeasonId) ?? null;

  return (
    <>
      <section
        className="w-full rounded-[18px] border p-4 md:p-5"
        style={{ backgroundColor: colors.panel, borderColor: colors.border }}
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">George Cup</p>
            <h1 className="text-lg font-semibold text-[var(--color-text)]">{season?.name ?? 'Choose season'}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowChooseSeason(true)}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-left"
              style={{ borderColor: colors.borderStrong, backgroundColor: colors.field }}
            >
              <span className="text-sm font-medium text-[var(--color-text)]">{season?.name ?? 'Choose season'}</span>
              <span className="text-sm text-[var(--color-muted)]">▾</span>
            </button>

            <button
              type="button"
              onClick={onBack}
              className="rounded-full border px-3 py-1.5 text-sm font-medium text-[var(--color-text)]"
              style={{ borderColor: colors.borderStrong, backgroundColor: colors.field }}
            >
              ← Back
            </button>
          </div>
        </div>

        {season ? (
          <GeorgeCupContent season={season} key={season.id} />
        ) : (
          <p className="py-10 text-center text-sm text-[var(--color-muted)]">No seasons available.</p>
        )}
      </section>

      <ChooseSeasonModal
        isOpen={showChooseSeason}
        seasons={seasons}
        selectedSeasonId={selectedSeasonId}
        onSelectSeason={(selected) => {
          setSelectedSeasonId(selected.id);
          setShowChooseSeason(false);
        }}
        onClose={() => setShowChooseSeason(false)}
      />
    </>
  );
}
