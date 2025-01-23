//src/components/ManagerOfTheWeekModal.tsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Player } from '../types/players';

type ManagerOfTheWeekModalProps = {
    gameWeekId: string;
    seasonId: string;
    onClose: () => void;
};

export default function ManagerOfTheWeekModal({ seasonId, onClose }: ManagerOfTheWeekModalProps) {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlayers = async () => {
            const { data: playersData } = await supabase
                .from('season_players')
                .select('profiles(id, username)')
                .eq('season_id', seasonId);

            if (playersData) {
                const typedData = playersData as unknown as { profiles: { id: string; username: string } }[];
                const players = typedData.map(p => ({
                    id: p.profiles.id,
                    username: p.profiles.username
                }));
                setPlayers(players);
            }
            setLoading(false);
        };

        fetchPlayers();
    }, [seasonId]);

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-8 border w-[90%] max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                >
                    ×
                </button>
                
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Manager of the Week</h2>
                
                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b dark:border-gray-700">
                                    <th className="px-4 py-2 text-left"></th>
                                    <th className="px-4 py-2 text-center font-medium text-gray-900 dark:text-gray-100">
                                        Correct Scores
                                    </th>
                                    <th className="px-4 py-2 text-center font-medium text-gray-900 dark:text-gray-100">
                                        Points
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {players.map((player) => (
                                    <tr key={player.id} className="border-b dark:border-gray-700">
                                        <td className="px-4 py-2 text-left font-medium text-gray-900 dark:text-gray-100">
                                            {player.username}
                                        </td>
                                        <td className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">
                                            0
                                        </td>
                                        <td className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">
                                            0
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}