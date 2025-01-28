//src/components/GameWeekDetail.tsx

 "use client";

import { useState } from 'react';
import ScoresModal from './ScoresModal';
import ManagerOfTheWeekModal from './ManagerOfTheWeekModal';

type GameWeekDetailProps = {
    gameWeek: {
        id: string;
        live_start: string;
    };
    seasonId: string;
    onBack: () => void;
};
export default function GameWeekDetail({ gameWeek, seasonId, onBack }: GameWeekDetailProps) {
    const [showScores, setShowScores] = useState(false);
    const [showManagerOfTheWeek, setShowManagerOfTheWeek] = useState(false);

    return (
        <div className="container mx-auto p-4 pl-24">
            <div className="w-full max-w-md mx-auto"> 
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                    Game Week {new Date(gameWeek.live_start).toLocaleDateString()}
                </h2>
                <button
                    onClick={onBack}
                    className="mb-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                >
                    Back to Game Weeks
                </button>                
                <div className="bg-white dark:bg-gray-800 p-8 rounded shadow-md">
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setShowScores(true)}
                            className="px-6 py-2 w-40 text-base bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300"
                        >
                            View Scores
                        </button>
                        <button
                            onClick={() => setShowManagerOfTheWeek(true)}
                            className="px-6 py-2 w-40 text-base bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300"
                        >
                            View Manager of the Week
                        </button>
                    </div>
                </div>
            </div>

            {showScores && (
                <ScoresModal
                    gameWeekId={gameWeek.id}
                    seasonId={seasonId}
                    onClose={() => setShowScores(false)}
                />
            )}

            {showManagerOfTheWeek && (
                <ManagerOfTheWeekModal
                    gameWeekId={gameWeek.id}
                    seasonId={seasonId}
                    onClose={() => setShowManagerOfTheWeek(false)}
                />
            )}
        </div>
    );
}