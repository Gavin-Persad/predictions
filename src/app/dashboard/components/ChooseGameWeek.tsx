"use client";

import { colors } from '../../stylecomponents/colors';

type Season = {
  id: string;
  name: string;
};

type GameWeek = {
  id: string;
  season_id: string;
  week_number: number;
  predictions_open: string;
  predictions_close: string;
  live_start: string;
  live_end: string;
  created_at: string;
};

type ChooseGameWeekProps = {
  isOpen: boolean;
  seasons: Season[];
  gameWeeks: GameWeek[];
  selectedSeasonId: string | null;
  selectedGameWeekId: string | null;
  onSeasonChange: (seasonId: string) => void;
  onSelectGameWeek: (gameWeek: GameWeek) => void;
  onClose: () => void;
};

export default function ChooseGameWeekModal({
  isOpen,
  seasons,
  gameWeeks,
  selectedSeasonId,
  selectedGameWeekId,
  onSeasonChange,
  onSelectGameWeek,
  onClose,
}: ChooseGameWeekProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div
        className="w-full max-w-2xl rounded-[18px] border p-5 shadow-2xl"
        style={{
          backgroundColor: colors.panel,
          borderColor: colors.border,
        }}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Choose week</p>
            <h3 className="text-xl font-semibold text-[var(--color-text)]">Game week selector</h3>
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

        <div className="mb-5">
          <label className="mb-2 block text-sm font-medium text-[var(--color-muted)]">Season</label>
          <select
            value={selectedSeasonId ?? ''}
            onChange={(event) => onSeasonChange(event.target.value)}
            className="w-full rounded-lg border px-3 py-3 text-[15px] text-[var(--color-text)] focus:border-transparent focus:outline-2 focus:outline-[var(--color-lime)]"
            style={{
              backgroundColor: colors.field,
              borderColor: colors.borderStrong,
            }}
          >
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name}
              </option>
            ))}
          </select>
        </div>

        <div className="game-week-list max-h-[55vh] space-y-2 overflow-y-auto pr-1">
          {gameWeeks.length === 0 ? (
            <div
              className="rounded-lg border border-dashed p-4 text-sm text-[var(--color-muted)]"
              style={{ borderColor: colors.borderStrong }}
            >
              No game weeks found for this season.
            </div>
          ) : (
            gameWeeks.map((gameWeek) => {
              const isSelected = gameWeek.id === selectedGameWeekId;

              return (
                <button
                  key={gameWeek.id}
                  type="button"
                  onClick={() => onSelectGameWeek(gameWeek)}
                  className="flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left transition-colors"
                  style={{
                    backgroundColor: isSelected ? colors.background : colors.field,
                    borderColor: isSelected ? colors.lime : colors.borderStrong,
                  }}
                >
                  <span className="text-base font-medium text-[var(--color-text)]">
                    Game Week {gameWeek.week_number}
                  </span>

                  <span
                    className="text-xs font-medium"
                    style={{
                      color: isSelected ? colors.lime : colors.muted,
                    }}
                  >
                    {isSelected ? 'Selected' : 'Choose'}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <style jsx>{`
          .game-week-list {
            scrollbar-width: thin;
            scrollbar-color: rgba(128, 140, 155, 0.7) rgba(15, 21, 28, 0.9);
          }

          .game-week-list::-webkit-scrollbar {
            width: 10px;
          }

          .game-week-list::-webkit-scrollbar-track {
            background: rgba(15, 21, 28, 0.9);
            border-radius: 9999px;
          }

          .game-week-list::-webkit-scrollbar-thumb {
            background: rgba(128, 140, 155, 0.7);
            border-radius: 9999px;
            border: 2px solid rgba(15, 21, 28, 0.9);
          }

          .game-week-list::-webkit-scrollbar-thumb:hover {
            background: rgba(182, 242, 60, 0.7);
          }
        `}</style>
      </div>
    </div>
  );
}
