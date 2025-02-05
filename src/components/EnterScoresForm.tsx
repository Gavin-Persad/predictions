// src/components/EnterScoresForm.tsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

type EnterScoresFormProps = {
    gameWeekId: string;
    onClose: () => void;
    onSave: () => void;
};

type Fixture = {
    id: string;
    game_week_id: string;
    fixture_number: number;
    home_team: string;
    away_team: string;
    home_score: number | null;
    away_score: number | null;
};

const ConfirmScoresModal = ({ fixtures, onConfirm, onCancel }: { 
    fixtures: Fixture[], 
    onConfirm: () => void, 
    onCancel: () => void 
}) => {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                    Confirm Scores
                </h2>
                <div className="space-y-4 mb-6">
                    {fixtures.map(fixture => (
                        <div 
                            key={fixture.id}
                            className="grid grid-cols-3 gap-4 items-center text-gray-900 dark:text-gray-100"
                        >
                            <div className="text-right">{fixture.home_team}</div>
                            <div className="text-center font-bold">
                                {fixture.home_score} - {fixture.away_score}
                            </div>
                            <div className="text-left">{fixture.away_team}</div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end gap-4">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition duration-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300"
                    >
                        Update League
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function EnterScoresForm({ gameWeekId, onClose, onSave }: EnterScoresFormProps) {
    const [fixtures, setFixtures] = useState<Fixture[]>([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        const fetchFixtures = async () => {
            const { data, error } = await supabase
                .from('fixtures')
                .select('*')
                .eq('game_week_id', gameWeekId)
                .order('fixture_number');

            if (error) {
                setMessage('Error fetching fixtures');
                console.error(error);
            } else {
                setFixtures(data);
            }
            setLoading(false);
        };

        fetchFixtures();
    }, [gameWeekId]);

    const handleScoreChange = (fixtureId: string, field: 'home_score' | 'away_score', value: string) => {
        const score = value === '' ? null : parseInt(value);
        setFixtures(fixtures.map(fixture => 
            fixture.id === fixtureId 
                ? { ...fixture, [field]: score }
                : fixture
        ));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');

        if (fixtures.some(f => 
            (f.home_score === null && f.away_score !== null) || 
            (f.home_score !== null && f.away_score === null)
        )) {
            setMessage('Both scores must be entered for each fixture');
            return;
        }

        setShowConfirmModal(true);
    };

    const handleSaveScores = async () => {
        try {
            const updates = fixtures.map(fixture => ({
                id: fixture.id,
                game_week_id: fixture.game_week_id,
                fixture_number: fixture.fixture_number,
                home_team: fixture.home_team,
                away_team: fixture.away_team,
                home_score: fixture.home_score,
                away_score: fixture.away_score
            }));
            
            const { error } = await supabase
                .from('fixtures')
                .upsert(updates, {
                    onConflict: 'id',
                    ignoreDuplicates: false
                });

            if (error) throw error;

            setMessage('Scores updated successfully');
            setShowConfirmModal(false);
            onSave();
        } catch (error) {
            console.error('Error:', error);
            setMessage('Error updating scores');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="w-full max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Enter Match Scores</h2>
            <button
                onClick={onClose}
                className="mb-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
            >
                Back
            </button>

            {message && (
                <p className={`mb-4 ${
                    message.includes('Error') ? 'text-red-500' : 'text-green-500'
                }`}>
                    {message}
                </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {fixtures.map(fixture => (
                    <div key={fixture.id} className="grid grid-cols-7 gap-4 items-center">
                        <div className="col-span-3 text-right text-gray-900 dark:text-gray-100">
                            {fixture.home_team}
                        </div>
                        <input
                            type="number"
                            min="0"
                            value={fixture.home_score ?? ''}
                            onChange={(e) => handleScoreChange(fixture.id, 'home_score', e.target.value)}
                            className="col-span-1 w-16 px-2 py-1 text-center border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                        />
                        <input
                            type="number"
                            min="0"
                            value={fixture.away_score ?? ''}
                            onChange={(e) => handleScoreChange(fixture.id, 'away_score', e.target.value)}
                            className="col-span-1 w-16 px-2 py-1 text-center border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                        />
                        <div className="col-span-2 text-left text-gray-900 dark:text-gray-100">
                            {fixture.away_team}
                        </div>
                    </div>
                ))}
                <div className="flex justify-end space-x-4 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition duration-300"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300"
                    >
                        Save Scores
                    </button>
                </div>
            </form>

            {showConfirmModal && (
                <ConfirmScoresModal
                    fixtures={fixtures}
                    onConfirm={handleSaveScores}
                    onCancel={() => setShowConfirmModal(false)}
                />
            )}
        </div>
    );
}