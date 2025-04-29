//src/app/dashboard/components/CurrentGameWeekTile.tsx

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../../../supabaseClient';

type GameWeek = {
  id: string;
  week_number: number;
  predictions_open: string;
  predictions_close: string;
  live_start: string;
  live_end: string;
  season_id: string;
};

type PlayerScore = {
  points: number;
  correct_scores: number;
};

export default function CurrentGameWeekTile() {
  const [currentGameWeek, setCurrentGameWeek] = useState<GameWeek | null>(null);
  const [gameWeekStatus, setGameWeekStatus] = useState<'upcoming' | 'predictions' | 'live' | 'awaiting_scores' | 'completed'>('upcoming');
  const [playerScore, setPlayerScore] = useState<PlayerScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGameWeekAndStatus = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get the current game week (most recent one)
        const now = new Date();
        const { data: gameWeeks, error } = await supabase
          .from('game_weeks')
          .select('*')
          .order('live_start', { ascending: false })
          .limit(1);

        if (error || !gameWeeks || gameWeeks.length === 0) {
          console.error('Error fetching game weeks:', error);
          setLoading(false);
          return;
        }

        const gameWeek = gameWeeks[0];
        setCurrentGameWeek(gameWeek);

        // Determine game week status based on dates
        const predOpen = new Date(gameWeek.predictions_open);
        const predClose = new Date(gameWeek.predictions_close);
        const liveStart = new Date(gameWeek.live_start);
        const liveEnd = new Date(gameWeek.live_end);

        let status: 'upcoming' | 'predictions' | 'live' | 'awaiting_scores' | 'completed';
        
        if (now < predOpen) {
          status = 'upcoming';
        } else if (now >= predOpen && now < predClose) {
          status = 'predictions';
        } else if (now >= predClose && now <= liveEnd) {
          status = 'live';
        } else {
          // Game week has ended, check if scores have been entered
          const { data: fixtures, error: fixtureError } = await supabase
            .from('fixtures')
            .select('home_score, away_score')
            .eq('game_week_id', gameWeek.id);

          if (fixtureError) {
            console.error('Error fetching fixtures:', fixtureError);
            status = 'awaiting_scores';
          } else {
            const scoresEntered = fixtures.some(fixture => 
              fixture.home_score !== null && fixture.away_score !== null
            );
            
            if (scoresEntered) {
              status = 'completed';
              
              // Fetch player scores
              const { data: scoreData, error: scoreError } = await supabase
                .from('game_week_scores')
                .select('points, correct_scores')
                .eq('game_week_id', gameWeek.id)
                .eq('player_id', user.id)
                .single();

              if (!scoreError && scoreData) {
                setPlayerScore({
                  points: scoreData.points,
                  correct_scores: scoreData.correct_scores
                });
              }
            } else {
              status = 'awaiting_scores';
            }
          }
        }

        setGameWeekStatus(status);
        setLoading(false);
      } catch (error) {
        console.error('Error in fetchGameWeekAndStatus:', error);
        setLoading(false);
      }
    };

    fetchGameWeekAndStatus();
  }, []);

  const getStatusText = () => {
    if (!currentGameWeek) return "No game week found";
    
    switch (gameWeekStatus) {
      case 'upcoming':
        return `Predictions open on ${new Date(currentGameWeek.predictions_open).toLocaleDateString()}`;
      case 'predictions':
        return "Predictions open! Click here to enter your scores";
      case 'live':
        return "Game week is now live";
      case 'awaiting_scores':
        return "Waiting on scores from host";
      case 'completed':
        return playerScore 
          ? `You scored ${playerScore.points} points with ${playerScore.correct_scores} correct scores` 
          : "Game week completed";
      default:
        return "Unknown status";
    }
  };

  const getStatusColor = () => {
    switch (gameWeekStatus) {
      case 'upcoming':
        return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300';
      case 'predictions':
        return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300';
      case 'live':
        return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300';
      case 'awaiting_scores':
        return 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300';
      case 'completed':
        return 'bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const getLinkText = () => {
    return "Enter Scores";
  };

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded min-h-[150px] flex items-center justify-center">
        <div className="animate-pulse text-gray-600 dark:text-gray-400">Loading game week...</div>
      </div>
    );
  }

  if (!currentGameWeek) {
    return (
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded min-h-[150px] flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-300 text-center">No game weeks found</p>
      </div>
    );
  }

  return (
    <Link href="/enterscores" className="block">
      <div className={`p-4 rounded min-h-[150px] ${getStatusColor()} transition-all hover:shadow-md`}>
        <div className="mb-4">
          <h3 className="font-semibold text-lg">
            Game Week {currentGameWeek.week_number}
          </h3>
          <p className="text-sm opacity-80">
            {new Date(currentGameWeek.live_start).toLocaleDateString()} - {new Date(currentGameWeek.live_end).toLocaleDateString()}
          </p>
        </div>
        
        <div className="mb-4">
          <p className="font-medium">{getStatusText()}</p>
        </div>
        
        <div className="flex justify-end">
          <div className="text-sm font-medium underline">
            {getLinkText()}
          </div>
        </div>
      </div>
    </Link>
  );
}