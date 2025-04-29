//src/app/dashboard/components/LeagueTableTile.tsx

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../../../supabaseClient';

type PlayerScore = {
  player_id: string;
  username: string;
  correct_scores: number;
  points: number;
  position: number;
};

export default function LeagueTableTile() {
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [currentUserScore, setCurrentUserScore] = useState<PlayerScore | null>(null);
  const [currentSeason, setCurrentSeason] = useState<{id: string, name: string} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
  
        // Get the most recent/current season
        const { data: seasons, error: seasonError } = await supabase
          .from('seasons')
          .select('id, name')
          .order('start_date', { ascending: false })
          .limit(1);
  
        if (seasonError || !seasons || seasons.length === 0) {
          console.error('Error fetching current season:', seasonError);
          setLoading(false);
          return;
        }
  
        const currentSeason = seasons[0];
        setCurrentSeason(currentSeason);
  
        // First check if there are any scores at all for this season
        const { count, error: countError } = await supabase
          .from('season_scores')
          .select('*', { count: 'exact', head: true })
          .eq('season_id', currentSeason.id);
          
        
        if (countError) {
          console.error('Error counting scores:', countError);
        }
        
        const { data: rawData, error } = await supabase
          .from('season_scores')
          .select(`
            player_id,
            correct_scores,
            points,
            profiles:player_id (username)
          `)
          .eq('season_id', currentSeason.id)
  
        if (error) {
          console.error('Error fetching league standings:', error);
          setLoading(false);
          return;
        }
  
        // Handle the case where some profiles might be missing
        const formattedScores = (rawData || []).map((score: any) => ({
          player_id: score.player_id,
          username: score.profiles?.username || 'Unknown Player',
          correct_scores: score.correct_scores || 0,
          points: score.points || 0,
          position: 0
        })).filter(score => score.username !== 'Unknown Player');
  
        // Sort by points (descending)
        const sortedScores = [...formattedScores].sort((a, b) => {
          // First by points
          if (b.points !== a.points) return b.points - a.points;
          // Then by correct scores
          return b.correct_scores - a.correct_scores;
        });

        // Add position numbers
        const positionedScores = sortedScores.map((score, index) => ({
          ...score,
          position: index + 1
        }));

        // Find current user's score
        const userScore = positionedScores.find(score => score.player_id === user.id) || null;
        setCurrentUserScore(userScore);

        // Get top 5 scores
        setScores(positionedScores.slice(0, 5));
        setLoading(false);

      } catch (error) {
        console.error('Error in LeagueTableTile:', error);
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded min-h-[150px] flex items-center justify-center">
        <div className="animate-pulse text-gray-600 dark:text-gray-400">Loading standings...</div>
      </div>
    );
  }

  if (!currentSeason || scores.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded min-h-[150px] flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-300 text-center">No league standings available</p>
      </div>
    );
  }

  // Check if current user is in top 5
  const isUserInTopFive = currentUserScore && currentUserScore.position <= 5;
  
  // If not in top 5, display top 5 and the user's position
  const displayScores = isUserInTopFive 
    ? scores 
    : (currentUserScore 
        ? [...scores.slice(0, 5), currentUserScore] 
        : scores);

  return (
    <Link 
      href={`/viewseason`}
      className="block"
    >
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded min-h-[150px] hover:shadow-md transition-all">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                <th className="py-2 text-left font-medium">#</th>
                <th className="py-2 text-left font-medium">Player</th>
                <th className="py-2 text-right font-medium">CS</th>
                <th className="py-2 text-right font-medium">Pts</th>
              </tr>
            </thead>
            <tbody>
              {displayScores.map((score, index) => (
                <tr 
                  key={score.player_id}
                  className={`
                    ${score.player_id === currentUserScore?.player_id 
                      ? 'bg-blue-50 dark:bg-blue-900/30 font-semibold' 
                      : ''}
                    ${!isUserInTopFive && index === 5 
                      ? 'border-t border-gray-200 dark:border-gray-600 mt-2' 
                      : ''}
                  `}
                >
                  <td className="py-2 text-gray-900 dark:text-gray-100">
                    {score.position}
                  </td>
                  <td className="py-2 text-gray-900 dark:text-gray-100">
                    {score.username}
                    {score.player_id === currentUserScore?.player_id && ' (You)'}
                  </td>
                  <td className="py-2 text-right text-gray-900 dark:text-gray-100">
                    {score.correct_scores}
                  </td>
                  <td className="py-2 text-right text-gray-900 dark:text-gray-100">
                    {score.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isUserInTopFive && currentUserScore && (
          <div className="mt-2 text-center text-xs italic text-gray-500 dark:text-gray-400">
            You are in position {currentUserScore.position}
          </div>
        )}
        <div className="text-center mt-3">
          <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
            View full standings →
          </span>
        </div>
      </div>
    </Link>
  );
}