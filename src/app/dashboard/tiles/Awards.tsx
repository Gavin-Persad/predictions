"use client";

import { colors } from '../../stylecomponents/colors';

type AwardsProps = {
  onOpen: () => void;
};

export default function Awards({ onOpen }: AwardsProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex min-h-[64px] w-full flex-col justify-center rounded-[14px] border px-4 py-3 text-left transition-colors hover:border-[#D6B35A] lg:min-h-0"
      style={{
        backgroundColor: colors.panel,
        borderColor: '#6A582D',
        backgroundImage: 'radial-gradient(ellipse at 0% 0%, rgba(217, 180, 74, 0.14), transparent 60%)',
        boxShadow: 'inset 0 0 18px rgba(214, 179, 74, 0.035)',
      }}
    >
      <span className="flex items-center justify-between gap-4">
        <span className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(214, 179, 90, 0.18)' }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#D6B35A"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
              <path d="M8 6H5v2a4 4 0 0 0 4 4M16 6h3v2a4 4 0 0 1-4 4M12 13v4m-3 3h6m-5-3h4" />
            </svg>
          </span>
          <span className="truncate text-sm font-semibold text-[var(--color-text)]">Awards</span>
        </span>

        <span className="shrink-0 text-sm font-medium" style={{ color: '#D6B35A' }}>
          View all
        </span>
      </span>

    </button>
  );
}
