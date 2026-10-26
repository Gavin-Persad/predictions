"use client";

import type { ReactNode } from 'react';
import { colors } from '../../stylecomponents/colors';

type TileProps = {
  title: string;
  className?: string;
  compact?: boolean;
  children?: ReactNode;
};

// Shared tile frame. With no children it renders a placeholder; compact puts the title and placeholder on one row.
export default function Tile({ title, className = '', compact = false, children }: TileProps) {
  return (
    <section
      aria-label={title}
      className={`flex min-h-0 flex-col rounded-[14px] border p-4 ${className}`}
      style={{ backgroundColor: colors.panel, borderColor: colors.border }}
    >
      {children ?? (
        <div
          className={
            compact
              ? 'flex flex-1 items-center justify-between gap-3'
              : 'flex flex-1 flex-col'
          }
        >
          <h3 className="text-sm font-semibold text-[var(--color-text)]">{title}</h3>
          <p className={compact ? 'text-xs text-[var(--color-muted)]' : 'mt-1 text-xs text-[var(--color-muted)]'}>
            Coming soon
          </p>
        </div>
      )}
    </section>
  );
}
