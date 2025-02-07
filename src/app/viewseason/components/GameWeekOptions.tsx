//src/app/viewseason/components/GameWeekOptions.tsx

"use client";

import { useState } from 'react';
import CreateGameWeek from './CreateGameWeek';
import EditGameWeekList from './EditGameWeekList';
import EnterScoresForm from './EnterScoresForm';
import EnterScoresGameWeekList from './EnterScoresGameWeekList';

type GameWeekOptionsProps = {
    seasonId: string;
    onClose: () => void;
};

export default function GameWeekOptions({ seasonId, onClose }: GameWeekOptionsProps) {
    const [showCreateWeek, setShowCreateWeek] = useState(false);
    const [showEditWeeks, setShowEditWeeks] = useState(false);
    const [showEnterScores, setShowEnterScores] = useState(false);

    if (showCreateWeek) {
        return <CreateGameWeek seasonId={seasonId} onClose={() => setShowCreateWeek(false)} />;
    }

    if (showEditWeeks) {
        return <EditGameWeekList seasonId={seasonId} onClose={() => setShowEditWeeks(false)} />;
    }

    if (showEnterScores) {
        return <EnterScoresGameWeekList
            seasonId={seasonId}
            onClose={() => setShowEnterScores(false)}
        />;
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                Game Week Management
            </h2>
            <button
                onClick={onClose}
                className="mb-8 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
            >
                Back to Season
            </button>
            <div className="w-full flex flex-col items-center">
                <div className="flex flex-wrap justify-center gap-4">
                    <button
                        onClick={() => setShowCreateWeek(true)}
                        className="px-4 py-2 w-32 sm:w-40 text-sm sm:text-base bg-green-600 text-white rounded hover:bg-green-700 transition duration-300"
                    >
                        Create Game Week
                    </button>
                    <button
                        onClick={() => setShowEditWeeks(true)}
                        className="px-4 py-2 w-32 sm:w-40 text-sm sm:text-base bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300"
                    >
                        Edit Game Week
                    </button>
                    <button
                        onClick={() => setShowEnterScores(true)}
                        className="px-4 py-2 w-32 sm:w-40 text-sm sm:text-base bg-yellow-600 text-white rounded hover:bg-yellow-700 transition duration-300"
                    >
                        Enter Scores
                    </button>
                </div>
            </div>
        </div>
    );
}