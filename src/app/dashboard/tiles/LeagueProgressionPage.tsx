"use client";

import { useEffect, useRef, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { colors } from '../../stylecomponents/colors';
import ChooseSeasonModal, { type Season } from '../components/ChooseSeason';
import { useLeagueProgression } from './useLeagueProgression';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type LeagueProgressionPageProps = {
  seasons: Season[];
  initialSeasonId: string | null;
  onBack: () => void;
};

const COLOR_PALETTE = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B195', '#C7CEEA',
  '#B5EAD7', '#FFDAB9', '#FFB6C1', '#DDA0DD', '#F0E68C',
  '#90EE90', '#87CEEB', '#FFD700', '#FF8C00', '#20B2AA',
];

function getConsistentColor(playerId: string): string {
  const index = playerId.charCodeAt(0) % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
}

export default function LeagueProgressionPage({
  seasons,
  initialSeasonId,
  onBack,
}: LeagueProgressionPageProps) {
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(initialSeasonId);
  const [showChooseSeason, setShowChooseSeason] = useState(false);
  const [visiblePlayers, setVisiblePlayers] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const { progressionData, currentStandings, currentUserId, loading, weeks } = useLeagueProgression(selectedSeasonId);
  const selectedSeason = seasons.find((season) => season.id === selectedSeasonId) ?? null;

  useEffect(() => {
    if (!loading && progressionData.length > 0 && currentUserId && visiblePlayers.size === 0) {
      const firstPlace = currentStandings.find((s) => s.position === 1);
      const lastPlace = currentStandings[currentStandings.length - 1];

      const initialVisible = new Set<string>();
      if (firstPlace) initialVisible.add(firstPlace.player_id);
      initialVisible.add(currentUserId);
      if (lastPlace) initialVisible.add(lastPlace.player_id);

      setVisiblePlayers(initialVisible);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, progressionData, currentStandings]);

  const handleShowAll = () => {
    setVisiblePlayers(new Set(progressionData.map((p) => p.player_id)));
  };

  const handleHideAll = () => {
    setVisiblePlayers(new Set());
  };

  const togglePlayer = (playerId: string) => {
    setVisiblePlayers((prev) => {
      const updated = new Set(prev);
      if (updated.has(playerId)) {
        updated.delete(playerId);
      } else {
        updated.add(playerId);
      }
      return updated;
    });
  };

  const chartData = {
    labels: weeks,
    datasets: progressionData
      .filter((p) => visiblePlayers.has(p.player_id))
      .map((player) => {
        const isCurrentUser = player.player_id === currentUserId;
        const baseColor = getConsistentColor(player.player_id);

        return {
          label: player.username,
          data: weeks.map((w) => player.weekly_positions[w] ?? null),
          borderColor: isCurrentUser ? colors.lime : baseColor,
          backgroundColor: isCurrentUser ? `${colors.lime}20` : `${baseColor}20`,
          borderWidth: isCurrentUser ? 3 : 2,
          pointRadius: isCurrentUser ? 6 : 4,
          pointBackgroundColor: isCurrentUser ? colors.lime : baseColor,
          pointBorderColor: isCurrentUser ? colors.lime : baseColor,
          pointBorderWidth: 2,
          tension: 0.4,
          fill: false,
        };
      }),
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          color: colors.text,
          font: { size: 12 },
          padding: 15,
          boxWidth: 10,
        },
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        ticks: { color: colors.muted, stepSize: 1 },
        grid: { color: colors.border },
        title: { display: true, text: 'Position', color: colors.text },
        reverse: true,
      },
      x: {
        ticks: { color: colors.muted },
        grid: { color: colors.border },
        title: { display: true, text: 'Game Week', color: colors.text },
      },
    },
  };

  const pillStyle = { borderColor: colors.borderStrong, backgroundColor: colors.field };

  const sortedPlayerList = [...progressionData].sort((a, b) => a.username.localeCompare(b.username));

  return (
    <>
      <div
        ref={containerRef}
        className="w-full h-full flex flex-col"
        style={{
          backgroundImage: 'radial-gradient(ellipse at 0% 0%, rgba(217, 180, 74, 0.14), transparent 60%)',
        }}
      >
      <div
        className="rounded-[18px] border p-4 md:p-5 flex flex-col flex-1 overflow-hidden"
        style={{ backgroundColor: colors.panel, borderColor: colors.border }}
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowChooseSeason(true)}
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-left"
            style={pillStyle}
          >
            <span className="text-sm font-medium text-[var(--color-text)] sm:text-base">
              {selectedSeason ? selectedSeason.name : 'Choose season'}
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

        <h2 className="mb-3 text-lg font-semibold text-[var(--color-text)]">League Progression</h2>

        {loading ? (
          <p className="py-10 text-center text-sm text-[var(--color-muted)]">Loading progression data...</p>
        ) : progressionData.length === 0 ? (
          <p className="py-10 text-center text-sm text-[var(--color-muted)]">No progression data available for this season.</p>
        ) : (
          <div className="flex flex-col flex-1 gap-4 overflow-hidden">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleShowAll}
                className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-95"
                style={{ backgroundColor: colors.lime, color: colors.background }}
              >
                Show all
              </button>
              <button
                type="button"
                onClick={handleHideAll}
                className="rounded-lg border px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition-opacity hover:opacity-95"
                style={{ borderColor: colors.border }}
              >
                Hide all
              </button>
            </div>

            <div className="flex-1 min-h-[300px] md:min-h-[500px] overflow-hidden">
              <Line data={chartData} options={chartOptions} />
            </div>

            <div className="max-h-[250px] overflow-y-auto rounded-lg border p-3" style={{ borderColor: colors.border }}>
              <p className="mb-3 text-xs font-semibold uppercase text-[var(--color-muted)]">Players</p>
              <div className="space-y-2">
                {sortedPlayerList.map((player) => (
                  <button
                    key={player.player_id}
                    type="button"
                    onClick={() => togglePlayer(player.player_id)}
                    className="flex w-full items-center gap-3 rounded-lg p-2 transition-colors hover:opacity-80"
                    style={{
                      backgroundColor: visiblePlayers.has(player.player_id) ? colors.field : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={visiblePlayers.has(player.player_id)}
                      onChange={() => togglePlayer(player.player_id)}
                      className="h-4 w-4 cursor-pointer"
                      style={{
                        accentColor: player.player_id === currentUserId ? colors.lime : getConsistentColor(player.player_id),
                      }}
                    />
                    <span className="flex-1 text-left text-sm text-[var(--color-text)]">
                      {player.username}
                      {player.player_id === currentUserId && ' (You)'}
                    </span>
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor: player.player_id === currentUserId ? colors.lime : getConsistentColor(player.player_id),
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

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
    </>
  );
}
