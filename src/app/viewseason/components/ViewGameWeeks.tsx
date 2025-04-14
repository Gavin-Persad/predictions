//src/app/viewseason/components/ViewGameWeeks.tsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../../../supabaseClient';
import GameWeekDetail from './GameWeekDetail';

type GameWeek = {
    id: string;
    week_number: number;
    live_start: string;
    live_end: string;
    predictions_open: string;
    predictions_close: string;
    seasons: {
        name: string;
    };
    lavery_cup_rounds: Array<{
        id: string;
        round_number: number;
        round_name: string;
    }>;
    george_cup_rounds: Array<{
        id: string;
        round_number: number;
        round_name: string;
    }>;
};

type ViewGameWeeksProps = {
    seasonId: string;
    onClose: () => void;
};


export default function ViewGameWeeks({ seasonId, onClose }: ViewGameWeeksProps) {
    const [gameWeeks, setGameWeeks] = useState<GameWeek[]>([]);
    const [selectedGameWeek, setSelectedGameWeek] = useState<GameWeek | null>(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchGameWeeks = async () => {
            const { data, error } = await supabase
            .from('game_weeks')
            .select(`
                *,
                seasons (
                    name
                ),
                lavery_cup_rounds (
                    id,
                    round_number,
                    round_name
                ),
                george_cup_rounds!george_cup_rounds_game_week_id_fkey (
                    id,
                    round_number,
                    round_name
                )
            `)
            .eq('season_id', seasonId)
            .order('live_start', { ascending: false });
    
            if (error) {
                setMessage('Error fetching game weeks');
                console.error(error);
            } else {
                setGameWeeks(data);
            }
        };
    
        fetchGameWeeks();
    }, [seasonId]);

    const checkGameWeekStatus = (gameWeek: GameWeek) => {
        const now = new Date();
        const predOpen = new Date(gameWeek.predictions_open);
        const predClose = new Date(gameWeek.predictions_close);
        const liveStart = new Date(gameWeek.live_start);
        const liveEnd = new Date(gameWeek.live_end);
    
        if (now > liveEnd) return 'Closed';
        if (now >= liveStart && now <= liveEnd) return 'Live';
        if (now >= predOpen && now <= predClose) return 'Predictions Open';
        return 'Upcoming';
    };

    if (selectedGameWeek) {
        return (
            <GameWeekDetail
                gameWeek={selectedGameWeek}
                seasonId={seasonId}
                onBack={() => setSelectedGameWeek(null)}
            />
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                View Game Weeks
            </h2>
            <button
                onClick={onClose}
                className="mb-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
            >
                Back to Season
            </button>
            {message && <p className="mb-4 text-red-500 dark:text-red-400">{message}</p>}
            
            <div className="w-full flex flex-col items-center">
                <div className="w-full max-w-2xl space-y-4">
                {gameWeeks.map((gameWeek) => {
                        const hasLaveryCupRound = gameWeek.lavery_cup_rounds && gameWeek.lavery_cup_rounds.length > 0;
                        const hasGeorgeCupRound = gameWeek.george_cup_rounds && gameWeek.george_cup_rounds.length > 0;
                        
                        return (
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
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {hasLaveryCupRound && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                                Lavery Cup - {gameWeek.lavery_cup_rounds[0].round_name}
                                            </span>
                                        )}
                                        {hasGeorgeCupRound && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                George Cup - {gameWeek.george_cup_rounds[0].round_name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {checkGameWeekStatus(gameWeek)}
                                </span>
                            </div>
                            </div>
                        );
                    })}
                    </div>
                </div>
            </div>
    );
}