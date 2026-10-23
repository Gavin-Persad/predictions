"use client";

import { useState } from 'react';
import { colors } from '../../stylecomponents/colors';
import ChooseGameWeekModal from './ChooseGameWeek';
import GameWeekScores from './GameWeekScores';
import ManagerOfTheWeek from './ManagerOfTheWeek';

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

type ViewGameWeekProps = {
  gameWeek: GameWeek;
  seasons: Season[];
  gameWeeks: GameWeek[];
  selectedSeasonId: string | null;
  onSeasonChange: (seasonId: string) => void;
  onSelectGameWeek: (gameWeek: GameWeek) => void;
  onBack: () => void;
};

export default function ViewGameWeek({
  gameWeek,
  seasons,
  gameWeeks,
  selectedSeasonId,
  onSeasonChange,
  onSelectGameWeek,
  onBack,
}: ViewGameWeekProps) {
  const [showChooseGameWeek, setShowChooseGameWeek] = useState(false);
  const [showManagerOfTheWeek, setShowManagerOfTheWeek] = useState(false);

  const pillStyle = { borderColor: colors.borderStrong, backgroundColor: colors.field };

  return (
    <>
      <div
        className="w-full rounded-[18px] border p-4 md:p-5"
        style={{ backgroundColor: colors.panel, borderColor: colors.border }}
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowChooseGameWeek(true)}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-left"
              style={pillStyle}
            >
              <span className="text-sm font-medium text-[var(--color-text)] sm:text-base">
                Game Week {gameWeek.week_number}
              </span>
              <span className="text-sm text-[var(--color-muted)]">▾</span>
            </button>

            <button
              type="button"
              onClick={() => setShowManagerOfTheWeek(true)}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium text-[var(--color-text)] sm:text-base"
              style={pillStyle}
            >
              🏆 Manager of the Week
            </button>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="rounded-full border px-3 py-1.5 text-sm font-medium text-[var(--color-text)]"
            style={pillStyle}
          >
            ← Back
          </button>
        </div>

        <GameWeekScores gameWeekId={gameWeek.id} seasonId={gameWeek.season_id} />
      </div>

      <ChooseGameWeekModal
        isOpen={showChooseGameWeek}
        seasons={seasons}
        gameWeeks={gameWeeks}
        selectedSeasonId={selectedSeasonId}
        selectedGameWeekId={gameWeek.id}
        onSeasonChange={onSeasonChange}
        onSelectGameWeek={(selected) => {
          onSelectGameWeek(selected);
          setShowChooseGameWeek(false);
        }}
        onClose={() => setShowChooseGameWeek(false)}
      />

      {showManagerOfTheWeek && (
        <ManagerOfTheWeek
          gameWeekId={gameWeek.id}
          seasonId={gameWeek.season_id}
          weekNumber={gameWeek.week_number}
          onClose={() => setShowManagerOfTheWeek(false)}
        />
      )}
    </>
  );
}
