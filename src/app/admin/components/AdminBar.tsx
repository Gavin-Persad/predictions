"use client";

import { colors } from '../../stylecomponents/colors';

export default function AdminBar() {
  return (
    <section
      aria-label="Host admin"
      className="w-full rounded-[18px] border p-4 md:p-5"
      style={{ backgroundColor: colors.panel, borderColor: colors.border }}
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">Host admin</p>

      <div
        className="flex min-h-[72px] items-center justify-center rounded-lg border border-dashed text-sm text-[var(--color-muted)]"
        style={{ backgroundColor: colors.field, borderColor: colors.borderStrong }}
      >
        Admin bar
      </div>
    </section>
  );
}
