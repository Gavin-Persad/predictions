//src/app/viewseason/components/ViewGameWeeks.tsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../../../supabaseClient';
import GameWeekDetail from './GameWeekDetail';
import { determineGameWeekStatus, getStatusLabel } from '../../../utils/gameWeekStatus';


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
    const [gameWeekStatuses, setGameWeekStatuses] = useState<{[key: string]: string}>({});


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
                
                // Fetch all statuses at once
                const statuses: {[key: string]: string} = {};
                for (const gameWeek of data) {
                    statuses[gameWeek.id] = await checkGameWeekStatus(gameWeek);
                }
                setGameWeekStatuses(statuses);
            }
        };
    
            fetchGameWeeks();
        }, [seasonId]);

        const checkGameWeekStatus = async (gameWeek: GameWeek) => {
            const status = await determineGameWeekStatus(gameWeek);
            return getStatusLabel(status);
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
                                    {gameWeekStatuses[gameWeek.id] || 'Loading...'}
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