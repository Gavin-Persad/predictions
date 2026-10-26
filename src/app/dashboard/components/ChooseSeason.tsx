"use client";

import { colors } from '../../stylecomponents/colors';

export type Season = {
  id: string;
  name: string;
};

type ChooseSeasonProps = {
  isOpen: boolean;
  seasons: Season[];
  selectedSeasonId: string | null;
  onSelectSeason: (season: Season) => void;
  onClose: () => void;
};

export default function ChooseSeasonModal({
  isOpen,
  seasons,
  selectedSeasonId,
  onSelectSeason,
  onClose,
}: ChooseSeasonProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div
        className="w-full max-w-md rounded-[18px] border p-5 shadow-2xl"
        style={{ backgroundColor: colors.panel, borderColor: colors.border }}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Choose season</p>
            <h3 className="text-xl font-semibold text-[var(--color-text)]">Season selector</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border px-3 py-1.5 text-sm font-medium text-[var(--color-text)]"
            style={{ borderColor: colors.borderStrong, backgroundColor: colors.field }}
          >
            Close
          </button>
        </div>

        <div className="season-list max-h-[55vh] space-y-2 overflow-y-auto pr-1">
          {seasons.length === 0 ? (
            <div
              className="rounded-lg border border-dashed p-4 text-sm text-[var(--color-muted)]"
              style={{ borderColor: colors.borderStrong }}
            >
              No seasons found.
            </div>
          ) : (
            seasons.map((season) => {
              const isSelected = season.id === selectedSeasonId;

              return (
                <button
                  key={season.id}
                  type="button"
                  onClick={() => onSelectSeason(season)}
                  className="flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left transition-colors"
                  style={{
                    backgroundColor: isSelected ? colors.background : colors.field,
                    borderColor: isSelected ? colors.lime : colors.borderStrong,
                  }}
                >
                  <span className="text-base font-medium text-[var(--color-text)]">{season.name}</span>
                  <span className="text-xs font-medium" style={{ color: isSelected ? colors.lime : colors.muted }}>
                    {isSelected ? 'Selected' : 'Choose'}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <style jsx>{`
          .season-list {
            scrollbar-width: thin;
            scrollbar-color: rgba(128, 140, 155, 0.7) rgba(15, 21, 28, 0.9);
          }

          .season-list::-webkit-scrollbar {
            width: 10px;
          }

          .season-list::-webkit-scrollbar-track {
            background: rgba(15, 21, 28, 0.9);
            border-radius: 9999px;
          }

          .season-list::-webkit-scrollbar-thumb {
            background: rgba(128, 140, 155, 0.7);
            border-radius: 9999px;
            border: 2px solid rgba(15, 21, 28, 0.9);
          }

          .season-list::-webkit-scrollbar-thumb:hover {
            background: rgba(182, 242, 60, 0.7);
          }
        `}</style>
      </div>
    </div>
  );
}
