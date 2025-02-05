//src/components/DeleteConfirmationModal.tsx

"use client";

import { useState } from 'react';

type DeleteConfirmationModalProps = {
    onConfirm: () => void;
    onCancel: () => void;
    isSubmitting?: boolean;
};

export default function DeleteConfirmationModal({ onConfirm, onCancel, isSubmitting }: DeleteConfirmationModalProps) {
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                    Delete Game Week
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                    This will permanently delete this game week and all its related data. Type DELETE to confirm.
                </p>
                <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Type DELETE to confirm"
                />
                <div className="flex justify-end gap-4">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition duration-300"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-white rounded transition duration-300 ${
                            deleteConfirmText === 'DELETE'
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-gray-400 cursor-not-allowed'
                        }`}
                        disabled={deleteConfirmText !== 'DELETE' || isSubmitting}
                    >
                        {isSubmitting ? 'Deleting...' : 'Delete Game Week'}
                    </button>
                </div>
            </div>
        </div>
    );
}