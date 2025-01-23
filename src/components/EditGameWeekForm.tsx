//src/components/EditGameWeekForm.tsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import ConfirmationModal from './ConfirmationModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';

type Fixture = {
    id: string;
    fixture_number: number;
    home_team: string;
    away_team: string;
};

type EditGameWeekFormProps = {
    gameWeek: {
        id: string;
        predictions_open: string;
        predictions_close: string;
        live_start: string;
        live_end: string;
    };
    onBack: () => void;
    onDelete?: () => void;
};

export default function EditGameWeekForm({ gameWeek, onBack, onDelete }: EditGameWeekFormProps) {
    const [predictionsOpen, setPredictionsOpen] = useState(gameWeek.predictions_open.slice(0, 16));
    const [liveStart, setLiveStart] = useState(gameWeek.live_start.slice(0, 16));
    const [liveEnd, setLiveEnd] = useState(gameWeek.live_end.slice(0, 16));
    const [fixtures, setFixtures] = useState<Fixture[]>([]);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

    useEffect(() => {
        const fetchFixtures = async () => {
            const { data, error } = await supabase
                .from('fixtures')
                .select('*')
                .eq('game_week_id', gameWeek.id)
                .order('fixture_number');

            if (error) {
                setMessage('Error loading fixtures');
                console.error(error);
            } else {
                setFixtures(data);
            }
        };

        fetchFixtures();
    }, [gameWeek.id]);

    const calculatePredictionsClose = () => {
        if (!liveStart) return '';
        const date = new Date(liveStart);
        date.setDate(date.getDate() - 1);
        date.setHours(23, 59, 59);
        return date.toISOString().slice(0, 16);
    };

    const validateDates = () => {
        const predOpen = new Date(predictionsOpen);
        const predClose = new Date(calculatePredictionsClose());
        const gameStart = new Date(liveStart);
        const gameEnd = new Date(liveEnd);

        if (predOpen >= predClose) {
            setMessage('Predictions must open before they close');
            return false;
        }
        if (predClose >= gameStart) {
            setMessage('Predictions must close before games start');
            return false;
        }
        if (gameStart >= gameEnd) {
            setMessage('Game week must start before it ends');
            return false;
        }
        return true;
    };

    const handleFixtureChange = (index: number, field: 'home_team' | 'away_team', value: string) => {
        const newFixtures = [...fixtures];
        newFixtures[index][field] = value;
        setFixtures(newFixtures);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');

        if (!predictionsOpen || !liveStart || !liveEnd) {
            setMessage('All fields are required');
            return;
        }

        if (!validateDates()) return;

        if (fixtures.some(f => !f.home_team || !f.away_team)) {
            setMessage('All fixtures must have both teams');
            return;
        }

        setShowConfirmation(true);
    };

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            const { error: gameWeekError } = await supabase
                .from('game_weeks')
                .update({
                    predictions_open: predictionsOpen,
                    predictions_close: calculatePredictionsClose(),
                    live_start: liveStart,
                    live_end: liveEnd
                })
                .eq('id', gameWeek.id);

            if (gameWeekError) throw gameWeekError;

            for (const fixture of fixtures) {
                const { error: fixtureError } = await supabase
                    .from('fixtures')
                    .update({
                        home_team: fixture.home_team,
                        away_team: fixture.away_team
                    })
                    .eq('id', fixture.id);

                if (fixtureError) throw fixtureError;
            }

            onBack();
        } catch (error) {
            setMessage('Error updating game week');
            console.error(error);
        } finally {
            setIsSubmitting(false);
            setShowConfirmation(false);
        }
    };

    const handleDelete = async () => {
        setIsSubmitting(true);
        try {
            const { error: fixturesError } = await supabase
                .from('fixtures')
                .delete()
                .eq('game_week_id', gameWeek.id);

            if (fixturesError) throw fixturesError;

            const { error: gameWeekError } = await supabase
                .from('game_weeks')
                .delete()
                .eq('id', gameWeek.id);

            if (gameWeekError) throw gameWeekError;

            if (onDelete) {
                onDelete();
            }
            onBack();
        } catch (error) {
            setMessage('Error deleting game week');
            console.error(error);
        } finally {
            setIsSubmitting(false);
            setShowDeleteConfirmation(false);
        }
    };

    return (
        <div className="flex flex-col items-center w-full">
            <button
                onClick={onBack}
                className="absolute top-4 left-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
            >
                Back
            </button>
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Edit Game Week</h2>
            
            {message && <p className="mb-4 text-red-500 dark:text-red-400">{message}</p>}
            
            <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Predictions Open
                        <input
                            type="datetime-local"
                            value={predictionsOpen}
                            onChange={(e) => setPredictionsOpen(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                            required
                        />
                    </label>

                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Live Start
                        <input
                            type="datetime-local"
                            value={liveStart}
                            onChange={(e) => setLiveStart(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                            required
                        />
                    </label>

                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Predictions Close (Auto-calculated)
                        <input
                            type="datetime-local"
                            value={calculatePredictionsClose()}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 dark:bg-gray-600 cursor-not-allowed"
                            disabled
                        />
                    </label>

                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Live End
                        <input
                            type="datetime-local"
                            value={liveEnd}
                            onChange={(e) => setLiveEnd(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                            required
                        />
                    </label>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Fixtures</h3>
                    {fixtures.map((fixture, index) => (
                        <div key={fixture.id} className="grid grid-cols-2 gap-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Home Team {fixture.fixture_number}
                                <input
                                    type="text"
                                    value={fixture.home_team}
                                    onChange={(e) => handleFixtureChange(index, 'home_team', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                    required
                                />
                            </label>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Away Team {fixture.fixture_number}
                                <input
                                    type="text"
                                    value={fixture.away_team}
                                    onChange={(e) => handleFixtureChange(index, 'away_team', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                    required
                                />
                            </label>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end space-x-4">
                <button
                    type="button"
                    onClick={() => setShowDeleteConfirmation(true)}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition duration-300 disabled:opacity-50"
                >
                    Delete Game Week
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition duration-300 disabled:opacity-50"
                >
                    {isSubmitting ? 'Updating...' : 'Update Game Week'}
                </button>
            </div>
        </form>

        {showConfirmation && (
            <ConfirmationModal
                gameWeekData={{
                    predictionsOpen,
                    predictionsClose: calculatePredictionsClose(),
                    liveStart,
                    liveEnd,
                    fixtures: fixtures.map(f => ({
                        number: f.fixture_number,
                        home: f.home_team,
                        away: f.away_team
                    }))
                }}
                onConfirm={handleConfirm}
                onCancel={() => setShowConfirmation(false)}
            />
        )}

        {showDeleteConfirmation && (
            <DeleteConfirmationModal
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteConfirmation(false)}
            />
        )}
    </div>
);
}