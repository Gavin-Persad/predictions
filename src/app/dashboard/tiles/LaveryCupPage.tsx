"use client";

import { colors } from '../../stylecomponents/colors';
import type { Season } from '../components/ChooseSeason';

type LaveryCupPageProps = {
  season: Season;
  onBack: () => void;
};

export default function LaveryCupPage({ season, onBack }: LaveryCupPageProps) {
  return (
    <section
      className="w-full rounded-[18px] border p-4 md:p-5"
      style={{ backgroundColor: colors.panel, borderColor: colors.border }}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">{season.name}</p>
          <h1 className="text-lg font-semibold text-[var(--color-text)]">Lavery Cup</h1>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="rounded-full border px-3 py-1.5 text-sm font-medium text-[var(--color-text)]"
          style={{ borderColor: colors.borderStrong, backgroundColor: colors.field }}
        >
          ← Back
        </button>
      </div>

      <p className="py-10 text-center text-sm text-[var(--color-muted)]">Lavery Cup details coming soon.</p>
    </section>
  );
}
