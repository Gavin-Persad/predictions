//src/components/GameWeekDetail.tsx

"use client";

import { useState } from 'react';
import ScoresModal from './ScoresModal';

type GameWeekDetailProps = {
    gameWeek: {
        id: string;
    };
    seasonId: string;
    onBack: () => void;
};

export default function GameWeekDetail({ gameWeek, seasonId, onBack }: GameWeekDetailProps) {
    const [showScores, setShowScores] = useState(false);

    return (
        <div className="flex flex-col items-center w-full">
            <button
                onClick={onBack}
                className="absolute top-4 left-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
            >
                Back
            </button>
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                Game Week Details
            </h2>
            
            <div className="flex space-x-4">
                <button
                    onClick={() => setShowScores(true)}
                    className="px-6 py-2 w-40 text-base bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300"
                >
                    View Scores
                </button>
                <button
                    className="px-6 py-2 w-40 text-base bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300"
                >
                    View Manager of the Week
                </button>
            </div>

            {showScores && (
                <ScoresModal
                    gameWeekId={gameWeek.id}
                    seasonId={seasonId}
                    onClose={() => setShowScores(false)}
                />
            )}
        </div>
    );
}