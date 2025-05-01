//src/app/viewseason/components/EnterScoresGameWeekList.tsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../../../supabaseClient';
import EnterScoresForm from './EnterScoresForm';
import { determineGameWeekStatus, getStatusLabel } from '../../../utils/gameWeekStatus';


type GameWeekListProps = {
    seasonId: string;
    onClose: () => void;
};

type GameWeek = {
    id: string;
    week_number: number;
    predictions_open: string;
    predictions_close: string;
    live_start: string;
    live_end: string;
    seasons: {
        name: string;
    };
    fixtures: Array<{
        home_score: number | null;
        away_score: number | null;
    }>;
};


export default function EnterScoresGameWeekList({ seasonId, onClose }: GameWeekListProps) {
    const [gameWeeks, setGameWeeks] = useState<GameWeek[]>([]);
    const [selectedGameWeek, setSelectedGameWeek] = useState<GameWeek | null>(null);
    const [loading, setLoading] = useState(true);
    const [gameWeekStatuses, setGameWeekStatuses] = useState<{[key: string]: string}>({});

    useEffect(() => {
        const fetchGameWeeks = async () => {
            const now = new Date().toISOString();
            
            const { data, error } = await supabase
                .from('game_weeks')
                .select(`
                    *,
                    seasons (
                        name
                    ),
                    fixtures (
                        home_score,
                        away_score
                    )
                `)
                .eq('season_id', seasonId)
                .lt('live_end', now)
                .order('live_start', { ascending: false });
        
            if (error) {
                console.error('Error:', error);
            } else {
                setGameWeeks(data);
                
                const statuses: {[key: string]: string} = {};
                for (const gameWeek of data) {
                    statuses[gameWeek.id] = await checkGameWeekStatus(gameWeek);
                }
                setGameWeekStatuses(statuses);
            }
            setLoading(false);
        };
    
        fetchGameWeeks();
    }, [seasonId]);

    const checkGameWeekStatus = async (gameWeek: GameWeek) => {
        const status = await determineGameWeekStatus(gameWeek);
        return getStatusLabel(status);
      };

    if (selectedGameWeek) {
        return (
            <EnterScoresForm
                gameWeekId={selectedGameWeek.id}
                onClose={() => setSelectedGameWeek(null)}
                onSave={() => setSelectedGameWeek(null)}
            />
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                Select Game Week
            </h2>
            <button
                onClick={onClose}
                className="mb-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
            >
                Back to Options
            </button>
    
            {loading ? (
                <p className="text-gray-900 dark:text-gray-100">Loading...</p>
            ) : (
                <div className="space-y-4">
                    {gameWeeks.map((gameWeek) => (
                        <div
                            key={gameWeek.id}
                            onClick={() => setSelectedGameWeek(gameWeek)}
                            className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg shadow hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer"
                        >
                            <div className="flex justify-between items-center">
                                <div className="text-left">
                                    <div className="font-medium text-gray-900 dark:text-gray-100">
                                        Game Week {gameWeek.week_number}, {gameWeek.seasons.name}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        {new Date(gameWeek.live_start).toLocaleDateString()} - {new Date(gameWeek.live_end).toLocaleDateString()}
                                    </div>
                                </div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {gameWeekStatuses[gameWeek.id] || 'Loading...'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}