//src/components/PredictionsForm.tsx

"use client";

import { useState, useEffect } from 'react';

type Fixture = {
    id: string;
    fixture_number: number;
    home_team: string;
    away_team: string;
};

type PredictionsFormProps = {
    fixtures: Fixture[];
    onSubmit: (predictions: { [key: string]: { home: number; away: number } }) => void;
    initialPredictions?: { [key: string]: { home: number; away: number } };
    onBack: () => void;
};

export default function PredictionsForm({ 
    fixtures, 
    onSubmit, 
    initialPredictions,
    onBack 
}: PredictionsFormProps) {
    const [predictions, setPredictions] = useState<{
        [key: string]: { home: number; away: number }
    }>(initialPredictions || {});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(predictions);
    };

    return (
        <div className="bg-gray-100 dark:bg-gray-900"> 
            <div className="bg-white dark:bg-gray-800 p-8 rounded shadow-md">
                <button
                    type="button"
                    onClick={onBack}
                    className="mb-8 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                >
                    Back
                </button>
                <form onSubmit={handleSubmit} className="space-y-4">
                {fixtures.map((fixture) => (
                    <div key={fixture.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center text-gray-900 dark:text-white p-2">
                        <div className="text-center sm:text-right text-sm sm:text-base">{fixture.home_team}</div>
                        <div className="flex justify-center space-x-2">
                            <input
                                type="number"
                                min="0"
                                value={predictions[fixture.id]?.home ?? ''}
                                onChange={(e) => setPredictions({
                                    ...predictions,
                                    [fixture.id]: {
                                        ...predictions[fixture.id],
                                        home: parseInt(e.target.value) || 0
                                    }
                                })}
                                className="w-12 p-1 text-center border rounded dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span>-</span>
                            <input
                                type="number"
                                min="0"
                                value={predictions[fixture.id]?.away ?? ''}
                                onChange={(e) => setPredictions({
                                    ...predictions,
                                    [fixture.id]: {
                                        ...predictions[fixture.id],
                                        away: parseInt(e.target.value) || 0
                                    }
                                })}
                                className="w-12 p-1 text-center border rounded dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>
                        <div className="text-center sm:text-left text-sm sm:text-base">{fixture.away_team}</div>
                    </div>
          ))}
                    <div className="flex justify-center mt-4">
                    <button 
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Submit Predictions
                    </button>
                </div>
              </form>
            </div>
        </div>
    );
}