// src/components/GameWeekOptions.tsx

"use client";

import { useState } from 'react';
import CreateGameWeek from './CreateGameWeek';
import EditGameWeekList from './EditGameWeekList';

type GameWeekOptionsProps = {
    seasonId: string;
    onClose: () => void;
};

export default function GameWeekOptions({ seasonId, onClose }: GameWeekOptionsProps) {
    const [showCreateWeek, setShowCreateWeek] = useState(false);
    const [showEditWeeks, setShowEditWeeks] = useState(false);

    if (showCreateWeek) {
        return <CreateGameWeek seasonId={seasonId} onClose={() => setShowCreateWeek(false)} />;
    }

    if (showEditWeeks) {
        return <EditGameWeekList seasonId={seasonId} onClose={() => setShowEditWeeks(false)} />;
    }

    return (
        <div className="container mx-auto p-4 pl-24">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                    Game Week Management
                </h2>
                <button
                    onClick={onClose}
                    className="mb-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                >
                    Back to Season
                </button>  
                <div>
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setShowCreateWeek(true)}
                            className="px-6 py-2 w-40 text-base bg-green-600 text-white rounded hover:bg-green-700 transition duration-300"
                        >
                            Create Game Week
                        </button>
                        <button
                            onClick={() => setShowEditWeeks(true)}
                            className="px-6 py-2 w-40 text-base bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300"
                        >
                            Edit Game Week
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}