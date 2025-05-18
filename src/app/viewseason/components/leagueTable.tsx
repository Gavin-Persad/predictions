//src/app/viewseason/components/leagueTable.tsx

import { useState, useEffect } from 'react';
import { supabase } from '../../../../supabaseClient';
import Sidebar from '../../../components/Sidebar';
import DarkModeToggle from '../../../components/darkModeToggle';

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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {

        const fetchCurrentUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
            setCurrentUserId(user.id);
            }
        };
        
        fetchCurrentUser();

        const fetchScores = async () => {
            // First, get all valid players for this season
            const { data: seasonPlayers, error: playersError } = await supabase
                .from('season_players')
                .select('player_id')
                .eq('season_id', seasonId);
                
            if (playersError || !seasonPlayers) {
                console.error('Error fetching season players:', playersError);
                return;
            }
            
            // Create a Set of valid player IDs for fast lookup
            const validPlayerIds = new Set(seasonPlayers.map(player => player.player_id));
            
            // Fetch scores
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
            
            // Filter scores to include only valid season players
            const filteredScores = data.filter(score => validPlayerIds.has(score.player_id));
            
            const formattedScores = filteredScores.map(score => ({
                player_id: score.player_id,
                username: score.profiles.username,
                correct_scores: score.correct_scores,
                points: score.points,
                position: 0
            }));
        
            // Sort by points then by correct scores
            const sortedScores = [...formattedScores].sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                
                return b.correct_scores - a.correct_scores;
            });
            
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
    } else if (sortField === 'position') {
        return modifier * (a.position - b.position);
    } else {
        return modifier * (a[sortField] - b[sortField]);
    }
});

return (
  <div className="flex">
      <Sidebar />
        <div className="flex-grow flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="absolute top-4 right-4">
                <DarkModeToggle />
            </div>
            <div className="w-full max-w-4xl mx-auto px-[5%]">
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">League Table</h2>
                <button
                    onClick={onClose}
                    className="mb-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                >
                    Back
                </button>

            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow w-full">
                <table className="min-w-full table-fixed">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th 
                                onClick={() => handleSort('position')}
                                className="w-[15%] px-2 sm:px-3 py-3 text-left cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Pos
                                </span>
                            </th>
                            <th 
                                onClick={() => handleSort('username')}
                                className="w-[40%] px-2 sm:px-4 py-3 text-left cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Player
                                </span>
                            </th>
                            <th 
                                onClick={() => handleSort('correct_scores')}
                                className="w-[20%] px-2 sm:px-3 py-3 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    CS
                                </span>
                            </th>
                            <th 
                                onClick={() => handleSort('points')}
                                className="w-[25%] px-2 sm:px-3 py-3 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Pts
                                </span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedScores.map((score) => (
                            <tr 
                                key={score.player_id}
                                className={`hover:bg-gray-50 dark:hover:bg-gray-700 
                                ${score.player_id === currentUserId 
                                    ? 'bg-blue-100 dark:bg-blue-900 font-semibold' 
                                    : ''}`}
                            >
                                <td className="px-2 sm:px-3 py-4 text-gray-900 dark:text-gray-100">
                                    {score.position}
                                </td>
                                <td className="px-2 sm:px-4 py-4 truncate text-gray-900 dark:text-gray-100">
                                    {score.username}
                                </td>
                                <td className="px-2 sm:px-3 py-4 text-center text-gray-900 dark:text-gray-100">
                                    {score.correct_scores}
                                </td>
                                <td className="px-2 sm:px-3 py-4 text-center text-gray-900 dark:text-gray-100">
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