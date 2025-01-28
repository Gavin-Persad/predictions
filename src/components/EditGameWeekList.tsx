// src/components/EditGameWeekList.tsx

"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import EditGameWeekForm from './EditGameWeekForm';

type EditGameWeekListProps = {
    seasonId: string;
    onClose: () => void;
};

type GameWeek = {
    id: string;
    season_id: string;
    predictions_open: string;
    predictions_close: string;
    live_start: string;
    live_end: string;
};

export default function EditGameWeekList({ seasonId, onClose }: EditGameWeekListProps) {
    const [gameWeeks, setGameWeeks] = useState<GameWeek[]>([]);
    const [selectedGameWeek, setSelectedGameWeek] = useState<GameWeek | null>(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchGameWeeks = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('game_weeks')
                .select('*')
                .eq('season_id', seasonId)
                .order('live_start', { ascending: false });

            if (error) {
                setMessage('Error fetching game weeks');
                console.error(error);
            } else {
                setGameWeeks(data);
            }
        } catch (err) {
            setMessage('Error fetching game weeks');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [seasonId]);

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
        <div className="container mx-auto p-4 pl-24">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                    Edit Game Weeks
                </h2>
                <button
                    onClick={onClose}
                    className="mb-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                >
                    Back to Options
                </button>
    
                <div className="bg-white dark:bg-gray-800 p-8 rounded shadow-md">
                    {loading ? (
                        <p>Loading...</p>
                    ) : (
                        <div className="w-full space-y-4">
                            {gameWeeks.map((gameWeek) => (
                                <div
                                    key={gameWeek.id}
                                    onClick={() => setSelectedGameWeek(gameWeek)}
                                    className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg shadow hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer"
                                >
                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                        Game Week {new Date(gameWeek.live_start).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Live: {new Date(gameWeek.live_start).toLocaleString()} - {new Date(gameWeek.live_end).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}