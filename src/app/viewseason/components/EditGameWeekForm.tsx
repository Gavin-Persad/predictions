//src/app/viewseason/components/EditGameWeekForm.tsx

"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../../../supabaseClient';
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
            // 1. First get all fixtures for this game week (needed to find predictions)
            const { data: fixturesData, error: fixturesQueryError } = await supabase
                .from('fixtures')
                .select('id')
                .eq('game_week_id', gameWeek.id);
                
            if (fixturesQueryError) throw fixturesQueryError;
            
            if (fixturesData && fixturesData.length > 0) {
                const fixtureIds = fixturesData.map(fixture => fixture.id);
                
                // 2. Delete all predictions linked to these fixtures - using a different approach
                for (const fixtureId of fixtureIds) {
                    const { error: predictionError } = await supabase
                        .from('predictions')
                        .delete()
                        .eq('fixture_id', fixtureId);
                    
                    if (predictionError) {
                        throw new Error(`Error deleting predictions for fixture ${fixtureId}: ${predictionError.message}`);
                    }
                }
                
                // 3. Verify predictions were deleted
                const { data: remainingPredictions, error: checkError } = await supabase
                    .from('predictions')
                    .select('fixture_id')
                    .in('fixture_id', fixtureIds);
                    
                if (checkError) throw checkError;
                
                if (remainingPredictions && remainingPredictions.length > 0) {
                    console.log('Remaining predictions:', remainingPredictions);
                    throw new Error('Failed to delete all predictions. Some still remain.');
                }
                
                // 4. Now delete fixtures one by one to better track errors
                for (const fixtureId of fixtureIds) {
                    const { error: fixtureDeleteError } = await supabase
                        .from('fixtures')
                        .delete()
                        .eq('id', fixtureId);
                        
                    if (fixtureDeleteError) {
                        throw new Error(`Error deleting fixture ${fixtureId}: ${fixtureDeleteError.message}`);
                    }
                }
            }
            
            // 5. Handle George Cup data
            const { data: georgeCupRounds, error: georgeCupRoundsError } = await supabase
                .from('george_cup_rounds')
                .select('id')
                .eq('game_week_id', gameWeek.id);
                
            if (georgeCupRoundsError) throw georgeCupRoundsError;

            if (georgeCupRounds && georgeCupRounds.length > 0) {
                const georgeCupRoundIds = georgeCupRounds.map(round => round.id);
                
                // Delete George Cup fixtures one by one for each round
                for (const roundId of georgeCupRoundIds) {
                    const { error: georgeCupFixturesError } = await supabase
                        .from('george_cup_fixtures')
                        .delete()
                        .eq('round_id', roundId);
                        
                    if (georgeCupFixturesError) {
                        throw new Error(`Error deleting george cup fixtures for round ${roundId}: ${georgeCupFixturesError.message}`);
                    }
                }
                
                // Verify fixtures were deleted
                const { data: remainingFixtures, error: checkFixturesError } = await supabase
                    .from('george_cup_fixtures')
                    .select('round_id')
                    .in('round_id', georgeCupRoundIds);
                    
                if (checkFixturesError) throw checkFixturesError;
                
                if (remainingFixtures && remainingFixtures.length > 0) {
                    console.log('Remaining george cup fixtures:', remainingFixtures);
                    throw new Error('Failed to delete all george cup fixtures. Some still remain.');
                }
                
                // Now delete each round individually
                for (const roundId of georgeCupRoundIds) {
                    const { error: deleteRoundError } = await supabase
                        .from('george_cup_rounds')
                        .delete()
                        .eq('id', roundId);
                        
                    if (deleteRoundError) {
                        throw new Error(`Error deleting george cup round ${roundId}: ${deleteRoundError.message}`);
                    }
                }
                
                // Verify rounds were deleted
                const { data: remainingRounds, error: checkRoundsError } = await supabase
                    .from('george_cup_rounds')
                    .select('id')
                    .eq('game_week_id', gameWeek.id);
                    
                if (checkRoundsError) throw checkRoundsError;
                
                if (remainingRounds && remainingRounds.length > 0) {
                    console.log('Remaining george cup rounds:', remainingRounds);
                    throw new Error('Failed to delete all george cup rounds. Some still remain.');
                }
            }

            // 6. Handle Lavery Cup data
            const { data: laveryCupRounds, error: laveryCupRoundsError } = await supabase
            .from('lavery_cup_rounds')
            .select('id')
            .eq('game_week_id', gameWeek.id);

            if (laveryCupRoundsError) throw laveryCupRoundsError;

            if (laveryCupRounds && laveryCupRounds.length > 0) {
            const laveryCupRoundIds = laveryCupRounds.map(round => round.id);

            // Delete Lavery Cup selections one by one
            for (const roundId of laveryCupRoundIds) {
                const { error: laveryCupSelectionsError } = await supabase
                    .from('lavery_cup_selections')
                    .delete()
                    .eq('round_id', roundId);
                    
                if (laveryCupSelectionsError) {
                    throw new Error(`Error deleting lavery cup selections for round ${roundId}: ${laveryCupSelectionsError.message}`);
                }
            }

            // Verify selections were deleted
            const { data: remainingSelections, error: checkSelectionsError } = await supabase
                .from('lavery_cup_selections')
                .select('round_id')
                .in('round_id', laveryCupRoundIds);
                
            if (checkSelectionsError) throw checkSelectionsError;

            if (remainingSelections && remainingSelections.length > 0) {
                console.log('Remaining lavery cup selections:', remainingSelections);
                throw new Error('Failed to delete all lavery cup selections. Some still remain.');
            }

            // Now delete each round individually
            for (const roundId of laveryCupRoundIds) {
                const { error: deleteRoundError } = await supabase
                    .from('lavery_cup_rounds')
                    .delete()
                    .eq('id', roundId);
                    
                if (deleteRoundError) {
                    throw new Error(`Error deleting lavery cup round ${roundId}: ${deleteRoundError.message}`);
                }
            }

            // Verify rounds were deleted
            const { data: remainingRounds, error: checkRoundsError } = await supabase
                .from('lavery_cup_rounds')
                .select('id')
                .eq('game_week_id', gameWeek.id);
                
            if (checkRoundsError) throw checkRoundsError;

            if (remainingRounds && remainingRounds.length > 0) {
                console.log('Remaining lavery cup rounds:', remainingRounds);
                throw new Error('Failed to delete all lavery cup rounds. Some still remain.');
            }
            }
            
            // Finally delete the game week itself
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
            setMessage(`Error deleting game week: ${error instanceof Error ? error.message : 'Unknown error'}`);
            console.error('Error deleting game week:', error);
        } finally {
            setIsSubmitting(false);
            setShowDeleteConfirmation(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                Edit Game Week
            </h2>
            <button
                onClick={onBack}
                className="mb-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
            >
                Back to Game Weeks
            </button>
    
            <div className="w-full flex flex-col items-center">
                {message && <p className="mb-4 text-red-500 dark:text-red-400">{message}</p>}
                
                <div className="w-full max-w-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
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
                        
                        <div className="flex justify-between mt-8">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </button>
                            
                            {onDelete && (
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirmation(true)}
                                    className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                    Delete Game Week
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
            
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