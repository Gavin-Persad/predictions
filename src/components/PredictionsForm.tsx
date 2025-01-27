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
};

export default function PredictionsForm({ 
    fixtures, 
    onSubmit, 
    initialPredictions 
}: PredictionsFormProps) {
    const [predictions, setPredictions] = useState<{
        [key: string]: { home: number; away: number }
    }>(initialPredictions || {});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(predictions);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {fixtures.map((fixture) => (
                <div key={fixture.id} className="grid grid-cols-3 gap-4 items-center text-gray-900 dark:text-white">
                    <div className="text-right">{fixture.home_team}</div>
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
                            className="w-16 text-center p-2 border rounded dark:bg-gray-700 dark:text-white"
                            required
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
                            className="w-16 text-center p-2 border rounded dark:bg-gray-700 dark:text-white"
                            required
                        />
                    </div>
                    <div className="text-left">{fixture.away_team}</div>
                </div>
            ))}
            <div className="flex justify-end">
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Submit Predictions
                </button>
            </div>
        </form>
    );
}