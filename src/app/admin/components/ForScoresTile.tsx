//src/app/admin/components/ForScoresTile.tsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../../../supabaseClient';
import { determineGameWeekStatus } from '../../../utils/gameWeekStatus';

type GameWeek = {
  id: string;
  week_number: number;
  predictions_open: string;
  predictions_close: string;
  live_start: string;
  live_end: string;
  fixtures: Array<{
    home_score: number | null;
    away_score: number | null;
  }>;
};

type ForScoresTileProps = {
  seasonId: string;
  onEnterScoresClick: () => void;
};

export default function ForScoresTile({ seasonId, onEnterScoresClick }: ForScoresTileProps) {
  const [readyGameWeeks, setReadyGameWeeks] = useState<GameWeek[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReadyGameWeeks = async () => {
      try {
        const now = new Date().toISOString();
        
        const { data, error } = await supabase
          .from('game_weeks')
          .select(`
            id,
            week_number,
            predictions_open,
            predictions_close,
            live_start,
            live_end,
            fixtures (
              home_score,
              away_score
            )
          `)
          .eq('season_id', seasonId)
          .lt('live_end', now)
          .order('live_start', { ascending: false });
      
        if (error) {
          console.error('Error fetching game weeks:', error);
          setLoading(false);
          return;
        }

        const awaiting: GameWeek[] = [];
        
        for (const gameWeek of data || []) {
          const status = await determineGameWeekStatus(gameWeek);
          if (status === 'awaiting_scores') {
            awaiting.push(gameWeek);
          }
        }

        setReadyGameWeeks(awaiting);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReadyGameWeeks();
  }, [seasonId]);

  if (loading || readyGameWeeks.length === 0) {
    return null;
  }

  const gameWeek = readyGameWeeks[0];
  const fixtureCount = gameWeek.fixtures?.length || 0;

  return (
    <div
      className="rounded-[14px] border p-4 md:p-5 mb-6 flex items-center justify-between gap-4 flex-wrap"
      style={{ 
        backgroundColor: '#B6F23C',
        borderColor: '#B6F23C',
        color: '#0B0F14'
      }}
    >
      <div className="flex items-center gap-4">
        <div>
          <div className="text-base font-semibold">
            Game week {gameWeek.week_number} is ready for scores
          </div>
          <div className="text-sm mt-1" style={{ color: '#2A3A10' }}>
            All {fixtureCount} fixtures have finished
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onEnterScoresClick}
        className="text-sm font-semibold px-4 py-2.5 rounded-[10px]"
        style={{ 
          backgroundColor: '#0B0F14',
          color: '#B6F23C'
        }}
      >
        Enter scores
      </button>
    </div>
  );
}
