//src/components/ScoresModal.tsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Player } from '../types/players';

type ScoresModalProps = {
    gameWeekId: string;
    seasonId: string;
    onClose: () => void;
};

type RawPlayerResponse = {
    profiles: {
        id: string;
        username: string;
    }
};

type Fixture = {
    id: string;
    fixture_number: number;
    home_team: string;
    away_team: string;
    home_score: number;
    away_score: number;
};

export default function ScoresModal({ gameWeekId, seasonId, onClose }: ScoresModalProps) {
    const [fixtures, setFixtures] = useState<Fixture[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const fetchData = async () => {
            const { data: fixturesData } = await supabase
                .from('fixtures')
                .select('*')
                .eq('game_week_id', gameWeekId)
                .order('fixture_number');
    
            const { data: playersData } = await supabase
                .from('season_players')
                .select('profiles(id, username)')
                .eq('season_id', seasonId);
    
            if (fixturesData) setFixtures(fixturesData);
            if (playersData) {

                const typedData = playersData as unknown as RawPlayerResponse[];
                const players = typedData.map(p => ({
                    id: p.profiles.id,
                    username: p.profiles.username
                }));

                setPlayers(players);
            }

            setLoading(false);
        };
    
        fetchData();
    }, [gameWeekId, seasonId]);

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-8 border w-[95%] max-w-6xl shadow-lg rounded-md bg-white dark:bg-gray-800">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                >
                    ×
                </button>
                
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Game Week Scores</h2>
                
                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
                        <table className="min-w-full">
                            <thead>
                                <tr>
                                    <th className="px-4 py-2 text-left text-gray-900 dark:text-gray-100"> </th>
                                    {fixtures.map((fixture) => (
                                        <th key={fixture.id} className="px-4 py-2 text-gray-900 dark:text-gray-100">
                                            <div className="whitespace-nowrap">
                                                {fixture.home_team}
                                            </div>
                                            <div className="text-xs">vs</div>
                                            <div className="whitespace-nowrap">
                                                {fixture.away_team}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {players.map((player) => (
                                    <tr key={player.id}>
                                        <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">
                                            {player.username}
                                        </td>
                                        {fixtures.map((fixture) => (
                                            <td key={fixture.id} className="px-4 py-2 text-center text-gray-900 dark:text-gray-100">
                                                0-0
                                            </td>
                                        ))}
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