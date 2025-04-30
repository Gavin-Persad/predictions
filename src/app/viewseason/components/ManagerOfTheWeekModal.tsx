//src/app/viewseason/components/ManagerOfTheWeekModal.tsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../../../supabaseClient';

type ManagerOfTheWeekModalProps = {
    gameWeekId: string;
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

export default function ManagerOfTheWeekModal({ gameWeekId, seasonId, onClose }: ManagerOfTheWeekModalProps) {
    const [scores, setScores] = useState<PlayerScore[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortField, setSortField] = useState<'position' | 'username' | 'correct_scores' | 'points'>('points');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        const fetchScores = async () => {
            const { data: seasonPlayers, error: playersError } = await supabase
                .from('season_players')
                .select('player_id')
                .eq('season_id', seasonId);
                
            if (playersError || !seasonPlayers) {
                console.error('Error fetching season players:', playersError);
                return;
            }
            
            const validPlayerIds = new Set(seasonPlayers.map(player => player.player_id));
        
            const { data: rawData, error } = await supabase
                .from('game_week_scores')
                .select(`
                    player_id,
                    correct_scores,
                    points,
                    profiles!inner (
                        username
                    )
                `)
                .eq('game_week_id', gameWeekId);
        
            if (error || !rawData) {
                console.error('Error:', error);
                return;
            }
        
            const data = rawData as unknown as DatabaseResponse[];
            
            const filteredScores = data.filter(score => validPlayerIds.has(score.player_id));
            
            const formattedScores = filteredScores.map(score => ({
                player_id: score.player_id,
                username: score.profiles.username,
                correct_scores: score.correct_scores,
                points: score.points,
                position: 0
            }));
        
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
    }, [gameWeekId, seasonId]);

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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-8 border w-[90%] max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Manager of the Week</h2>
                
                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b dark:border-gray-700">
                                    <th 
                                        onClick={() => handleSort('position')}
                                        className="px-4 py-2 text-left cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Position
                                        </span>
                                    </th>
                                    <th 
                                        onClick={() => handleSort('username')}
                                        className="px-4 py-2 text-left cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Player
                                        </span>
                                    </th>
                                    <th 
                                        onClick={() => handleSort('correct_scores')}
                                        className="px-4 py-2 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Correct Scores
                                        </span>
                                    </th>
                                    <th 
                                        onClick={() => handleSort('points')}
                                        className="px-4 py-2 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Points
                                        </span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedScores.map((score) => (
                                    <tr 
                                        key={score.player_id} 
                                        className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        <td className="px-4 py-2 text-left font-medium text-gray-900 dark:text-gray-100">
                                            {score.position}
                                        </td>
                                        <td className="px-4 py-2 text-left font-medium text-gray-900 dark:text-gray-100">
                                            {score.username}
                                        </td>
                                        <td className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">
                                            {score.correct_scores}
                                        </td>
                                        <td className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">
                                            {score.points}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <button
                    onClick={onClose}
                    className="mt-6 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                >
                    Close
                </button>
            </div>
        </div>
    );
}