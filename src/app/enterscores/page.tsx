//src/app/enterscores/page.tsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import PredictionsForm from '../../components/PredictionsForm';
import PredictionsDisplay from '../../components/PredictionsDisplay';
import Sidebar from '../../components/Sidebar';
import DarkModeToggle from '../../components/darkModeToggle';

type GameWeek = {
    id: string;
    week_number: number;
    predictions_open: string;
    predictions_close: string;
    live_start: string;
    live_end: string;
};

type Fixture = {
    id: string;
    fixture_number: number;
    home_team: string;
    away_team: string;
    game_week_id: string;
};

export default function PredictionsPage() {
    const [gameWeeks, setGameWeeks] = useState<GameWeek[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGameWeek, setSelectedGameWeek] = useState<string | null>(null);
    const [fixtures, setFixtures] = useState<Fixture[]>([]);
    const [predictions, setPredictions] = useState<{[key: string]: {home: number, away: number}}>({});
    const [isEditing, setIsEditing] = useState(false);

    const checkGameWeekStatus = (gameWeek: GameWeek) => {
        const now = new Date();
        const predOpen = new Date(gameWeek.predictions_open);
        const predClose = new Date(gameWeek.predictions_close);
        const liveStart = new Date(gameWeek.live_start);
        const liveEnd = new Date(gameWeek.live_end);

        if (now > liveEnd) return 'past';
        if (now >= liveStart && now <= liveEnd) return 'live';
        if (now >= predOpen && now <= predClose) return 'predictions';
        return 'upcoming';
    };

    useEffect(() => {
        const fetchGameWeeks = async () => {
            const { data, error } = await supabase
                .from('game_weeks')
                .select('*')
                .order('week_number', { ascending: false });

            if (error) {
                console.error('Error:', error);
            } else {
                setGameWeeks(data || []);
            }
            setLoading(false);
        };

        fetchGameWeeks();
    }, []);

    useEffect(() => {
        if (selectedGameWeek) {
            const fetchFixtures = async () => {
                const { data: fixturesData } = await supabase
                    .from('fixtures')
                    .select('*')
                    .eq('game_week_id', selectedGameWeek)
                    .order('fixture_number');

                if (fixturesData) setFixtures(fixturesData);

                const user = (await supabase.auth.getUser()).data.user;
                if (user && fixturesData) {
                    const { data: predictionsData } = await supabase
                        .from('predictions')
                        .select('*')
                        .in('fixture_id', fixturesData.map(f => f.id))
                        .eq('user_id', user.id);

                    if (predictionsData) {
                        const predMap = predictionsData.reduce((acc, pred) => ({
                            ...acc,
                            [pred.fixture_id]: {
                                home: pred.home_prediction,
                                away: pred.away_prediction
                            }
                        }), {});
                        setPredictions(predMap);
                    }
                }
            };
            fetchFixtures();
        }
    }, [selectedGameWeek]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'past':
                return 'bg-slate-100 hover:bg-slate-200 text-slate-700';
            case 'live':
                return 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800';
            case 'predictions':
                return 'bg-amber-50 hover:bg-amber-100 text-amber-800';
            case 'upcoming':
                return 'bg-blue-50 hover:bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-50 hover:bg-gray-100 text-gray-800';
        }
    };

    const handleSubmitPredictions = async (newPredictions: {[key: string]: {home: number, away: number}}) => {
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) {
                console.error('No user found');
                return;
            }

            const predictionsToUpsert = Object.entries(newPredictions).map(([fixture_id, scores]) => ({
                user_id: user.id,
                fixture_id,
                home_prediction: scores.home,
                away_prediction: scores.away,
                updated_at: new Date().toISOString()
            }));

            const { error } = await supabase
                .from('predictions')
                .upsert(predictionsToUpsert, {
                    onConflict: 'user_id,fixture_id'
                });

            if (error) {
                console.error('Error upserting predictions:', error);
                return;
            }

            setPredictions(newPredictions);
            setIsEditing(false);

        } catch (error) {
            console.error('Error in handleSubmitPredictions:', error);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    return (
        <div className="flex">
            <Sidebar />
            <div className="flex-grow flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="absolute top-4 right-4">
                    <DarkModeToggle />
                </div>
                <div className="bg-white dark:bg-gray-800 p-8 rounded shadow-md w-full max-w-4xl">
                    {loading ? (
                        <div>Loading...</div>
                    ) : !selectedGameWeek ? (
                        <>
                            <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
                                Game Week Predictions
                            </h1>
                            <div className="space-y-4">
                                {gameWeeks.map((gameWeek) => {
                                    const status = checkGameWeekStatus(gameWeek);
                                    return (
                                        <button
                                            key={gameWeek.id}
                                            onClick={() => setSelectedGameWeek(gameWeek.id)}
                                            className={`w-full p-4 rounded-lg shadow transition-colors duration-200 ${getStatusStyle(status)}`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium">Game Week {gameWeek.week_number}</span>
                                                <span className="text-sm">
                                                    {status === 'predictions' && 'Open for Predictions'}
                                                    {status === 'live' && 'Live'}
                                                    {status === 'past' && 'Closed'}
                                                    {status === 'upcoming' && 'Upcoming'}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <>
                            {checkGameWeekStatus(gameWeeks.find(gw => gw.id === selectedGameWeek)!) === 'predictions' ? (
                                isEditing || Object.keys(predictions).length === 0 ? (
                                    <PredictionsForm
                                        fixtures={fixtures}
                                        onSubmit={handleSubmitPredictions}
                                        initialPredictions={predictions}
                                        onBack={() => setSelectedGameWeek(null)}
                                    />
                                ) : (
                                    <PredictionsDisplay
                                        fixtures={fixtures}
                                        predictions={predictions}
                                        canEdit={true}
                                        onEdit={() => setIsEditing(true)}
                                        onBack={() => setSelectedGameWeek(null)}
                                    />
                                )
                            ) : (
                                <PredictionsDisplay
                                    fixtures={fixtures}
                                    predictions={predictions}
                                    canEdit={false}
                                    onBack={() => setSelectedGameWeek(null)}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}