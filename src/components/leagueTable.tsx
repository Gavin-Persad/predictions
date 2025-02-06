// src/components/leagueTable.tsx

import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import Sidebar from './Sidebar';
import DarkModeToggle from './darkModeToggle';

type LeagueTableProps = {
  seasonId: string;
  onClose: () => void;
};

type PlayerScore = {
  player_id: string;
  username: string;
  correct_scores: number;
  points: number;
  position: number;
};

interface DatabaseResponse {
  player_id: string;
  correct_scores: number;
  points: number;
  profiles: {
      username: string;
  }
}

export default function LeagueTable({ seasonId, onClose }: LeagueTableProps) {
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<'position' | 'username' | 'correct_scores' | 'points'>('points');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
      const fetchScores = async () => {
          const { data: rawData, error } = await supabase
              .from('season_scores')
              .select(`
                  player_id,
                  correct_scores,
                  points,
                  profiles (
                      username
                  )
              `)
              .eq('season_id', seasonId);

          if (error || !rawData) {
              console.error('Error:', error);
              return;
          }

          const data = rawData as unknown as DatabaseResponse[];
          
          const formattedScores = data.map(score => ({
              player_id: score.player_id,
              username: score.profiles.username,
              correct_scores: score.correct_scores,
              points: score.points,
              position: 0
          }));

          const sortedScores = [...formattedScores].sort((a, b) => b.points - a.points);
          const positionedScores = sortedScores.map((score, index) => ({
              ...score,
              position: index + 1
          }));

          setScores(positionedScores);
          setLoading(false);
      };

      fetchScores();
  }, [seasonId]);

  const handleSort = (field: typeof sortField) => {
    if (field === sortField) {
        setSortDirection(current => current === 'asc' ? 'desc' : 'asc');
    } else {
        setSortField(field);
        setSortDirection('desc');
    }
};

const sortedScores = [...scores].sort((a, b) => {
    const modifier = sortDirection === 'asc' ? 1 : -1;
    if (sortField === 'username') {
        return modifier * a.username.localeCompare(b.username);
    }
    return modifier * (a[sortField] - b[sortField]);
});

return (
  <div className="flex">
      <Sidebar />
      <div className="flex-grow flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
          <div className="absolute top-4 right-4">
              <DarkModeToggle />
          </div>
          <div className="w-full max-w-4xl mx-auto p-4">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">League Table</h2>
              <button
                  onClick={onClose}
                  className="mb-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
              >
                  Back
              </button>

              <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                  <table className="min-w-full">
                      <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th 
                                  onClick={() => handleSort('position')}
                                  className="px-6 py-3 text-left cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                      Position
                                  </span>
                              </th>
                              <th 
                                  onClick={() => handleSort('username')}
                                  className="px-6 py-3 text-left cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                      Player
                                  </span>
                              </th>
                              <th 
                                  onClick={() => handleSort('correct_scores')}
                                  className="px-6 py-3 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                      Correct Scores
                                  </span>
                              </th>
                              <th 
                                  onClick={() => handleSort('points')}
                                  className="px-6 py-3 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                      Points
                                  </span>
                              </th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {sortedScores.map((score) => (
                              <tr 
                                  key={score.player_id}
                                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                                      {score.position}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                                      {score.username}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center text-gray-900 dark:text-gray-100">
                                      {score.correct_scores}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center text-gray-900 dark:text-gray-100">
                                      {score.points}
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
  </div>
);
}