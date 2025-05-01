//src/app/viewseason/components/EditGameWeekList.tsx

"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../../supabaseClient';
import EditGameWeekForm from './EditGameWeekForm';
import { determineGameWeekStatus, getStatusLabel } from '../../../utils/gameWeekStatus';


type EditGameWeekListProps = {
    seasonId: string;
    onClose: () => void;
};

type GameWeek = {
    id: string;
    season_id: string;
    week_number: number;
    predictions_open: string;
    predictions_close: string;
    live_start: string;
    live_end: string;
    seasons: {
        name: string;
    };
};

export default function EditGameWeekList({ seasonId, onClose }: EditGameWeekListProps) {
    const [gameWeeks, setGameWeeks] = useState<GameWeek[]>([]);
    const [selectedGameWeek, setSelectedGameWeek] = useState<GameWeek | null>(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [gameWeekStatuses, setGameWeekStatuses] = useState<{[key: string]: string}>({});


    const fetchGameWeeks = useCallback(async () => {
        try {
            const { data, error } = await supabase
            .from('game_weeks')
            .select(`
                *,
                seasons (
                    name
                )
            `)
            .eq('season_id', seasonId)
            .order('live_start', { ascending: false });

            if (error) {
                setMessage('Error fetching game weeks');
                console.error(error);
            } else {
                setGameWeeks(data);
                
                const statuses: {[key: string]: string} = {};
                for (const gameWeek of data) {
                    statuses[gameWeek.id] = await checkGameWeekStatus(gameWeek);
                }
                setGameWeekStatuses(statuses);
            }

        } catch (err) {

            setMessage('Error fetching game weeks');
            console.error(err);

        } finally {

            setLoading(false);
        }
    }, [seasonId]);

    const checkGameWeekStatus = async (gameWeek: GameWeek) => {
        const status = await determineGameWeekStatus(gameWeek);
        return getStatusLabel(status);
      };

    useEffect(() => {
        fetchGameWeeks();
    }, [fetchGameWeeks]);

    if (selectedGameWeek) {
        return (
            <EditGameWeekForm
                gameWeek={selectedGameWeek}
                onBack={() => setSelectedGameWeek(null)}
                onDelete={fetchGameWeeks}
            />
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                Edit Game Weeks
            </h2>
            <button
                onClick={onClose}
                className="mb-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
            >
                Back to Options
            </button>
    
            <div className="w-full flex flex-col items-center">
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <div className="w-full max-w-2xl space-y-4">
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
                                    <span className="text-sm">
                                        {gameWeekStatuses[gameWeek.id] || 'Loading...'}
                                    </span>
                                </div>
                            </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
    );
}