import React from 'react';

export default function EditAwardWinners({ seasonId, onClose }: { seasonId: string, onClose: () => void }) {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Edit Award Winners</h2>
            {/* TODO: Admin form to edit award winners for the season */}
            <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
            >
                Back
            </button>
        </div>
    );
}