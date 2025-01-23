//src/components/DeleteConfirmationModal.tsx

"use client";

type DeleteConfirmationModalProps = {
    onConfirm: () => void;
    onCancel: () => void;
};

export default function DeleteConfirmationModal({ onConfirm, onCancel }: DeleteConfirmationModalProps) {
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-8 border w-[90%] max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Confirm Delete</h2>
                <p className="mb-6 text-gray-700 dark:text-gray-300">
                    Are you sure? This will delete the game week and all data related.
                </p>
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}