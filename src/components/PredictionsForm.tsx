//src/components/PredictionsForm.tsx

"use client";

import { useState, useEffect } from 'react';

type Fixture = {
    id: string;
    fixture_number: number;
    home_team: string;
    away_team: string;
    game_week_id: string;
};

type PredictionsFormProps = {
    fixtures: Fixture[];
    onSubmit: (predictions: { [key: string]: { home: number; away: number } }) => void;
    initialPredictions?: { [key: string]: { home: number; away: number } };
};

export default function PredictionsForm({ fixtures, onSubmit, initialPredictions }: PredictionsFormProps) {
    const [predictions, setPredictions] = useState<{ [key: string]: { home: number; away: number } }>({});
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        if (initialPredictions) {
            setPredictions(initialPredictions);
        }
    }, [initialPredictions]);

    useEffect(() => {
        const complete = fixtures.every(
            (fixture) => 
                predictions[fixture.id]?.home !== undefined && 
                predictions[fixture.id]?.away !== undefined
        );
        setIsComplete(complete);
    }, [predictions, fixtures]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isComplete) {
            onSubmit(predictions);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {fixtures.map((fixture) => (
                <div key={fixture.id} className="grid grid-cols-3 gap-4 items-center">
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
                                    home: parseInt(e.target.value) 
                                }
                            })}
                            className="w-16 text-center p-2 border rounded"
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
                                    away: parseInt(e.target.value)
                                }
                            })}
                            className="w-16 text-center p-2 border rounded"
                            required
                        />
                    </div>
                    <div className="text-left">{fixture.away_team}</div>
                </div>
            ))}
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={!isComplete}
                    className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                >
                    Submit Predictions
                </button>
            </div>
        </form>
    );
}