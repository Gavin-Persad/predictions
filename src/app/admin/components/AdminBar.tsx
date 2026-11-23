"use client";

import Link from 'next/link';
import { colors } from '../../stylecomponents/colors';

export default function AdminBar() {
  return (
    <section
      aria-label="Host admin"
      className="w-full rounded-[18px] border p-4 md:p-5"
      style={{ backgroundColor: colors.panel, borderColor: colors.border }}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">Host alerts</p>
        <Link
          href="/admin"
          className="rounded-full border px-3 py-1.5 text-sm font-medium text-[var(--color-text)] transition-colors hover:opacity-80"
          style={{ borderColor: colors.borderStrong, backgroundColor: colors.field }}
        >
          Admin View
        </Link>
      </div>

      <div
        className="flex min-h-[72px] items-center justify-center rounded-lg border border-dashed text-sm text-[var(--color-muted)]"
        style={{ backgroundColor: colors.field, borderColor: colors.borderStrong }}
      >
        Admin bar
      </div>
    </section>
  );
}
