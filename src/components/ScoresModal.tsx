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

type Fixture = {
    id: string;
    fixture_number: number;
    home_team: string;
    away_team: string;
    home_score: number;
    away_score: number;
};

type Prediction = {
    id: string;
    user_id: string;
    fixture_id: string;
    home_prediction: number;
    away_prediction: number;
    created_at: string;
    updated_at: string;
};

type PlayerResponse = {
    profiles: {
        id: string;
        username: string;
    };
};

export default function ScoresModal({ gameWeekId, seasonId, onClose }: ScoresModalProps) {
    const [fixtures, setFixtures] = useState<Fixture[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<string>('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: fixturesData, error: fixturesError } = await supabase
                    .from('fixtures')
                    .select('*')
                    .eq('game_week_id', gameWeekId);
    
                if (fixturesError) throw fixturesError;
    
                const { data: playersData, error: playersError } = await supabase
                    .from('season_players')
                    .select(`
                        profiles (
                            id,
                            username
                        )
                    `)
                    .eq('season_id', seasonId);
    
                if (playersError) throw playersError;
    
                const formattedPlayers = (playersData as unknown as PlayerResponse[]).map(p => ({
                    id: p.profiles.id,
                    username: p.profiles.username
                }));
    

            const { data: predictionsData, error: predictionsError } = await supabase
            .from('predictions')
                    .select('*')
                    .in('fixture_id', fixturesData?.map(f => f.id) || []);
    
                if (predictionsError) throw predictionsError;
    
                setFixtures(fixturesData || []);
                setPlayers(formattedPlayers);
                setPredictions(predictionsData || []);
                setLoading(false);
            } catch (error) {
                console.error('Error:', error);
                setMessage('Error fetching data');
                setLoading(false);
            }
        };

        fetchData();
    }, [gameWeekId, seasonId]);  

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-6xl w-full">
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Game Week Scores</h2>
                
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="px-4 py-2 text-left border-b dark:border-gray-700"> </th>
                                    {fixtures.map(fixture => (
                                        <th key={fixture.id} className="px-4 py-2 text-center border-b dark:text-gray-100 border-gray-700">
                                            {fixture.home_team}<br/>vs<br/>{fixture.away_team}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {players.map(player => (
                                    <tr key={player.id}>
                                        <td className="px-4 py-2 font-medium border-b dark:text-gray-100 border-gray-700">
                                            {player.username}
                                        </td>
                                        {fixtures.map(fixture => {
                                            const prediction = predictions.find(
                                                p => p.user_id === player.id && p.fixture_id === fixture.id
                                            );
                                            return (
                                                <td key={fixture.id} className="px-4 py-2 text-center border-b dark:text-gray-100 border-gray-700">
                                                    {prediction ? 
                                                        `${prediction.home_prediction}-${prediction.away_prediction}` : 
                                                        '-'
                                                    }
                                                </td>
                                            );
                                        })}
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