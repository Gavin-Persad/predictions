//src/app/createseason/components/SeasonConfirmationModal.tsx

type SeasonConfirmationModalProps = {
    seasonData: {
        name: string;
        startDate: string;
        endDate: string;
        players: { id: string; username: string }[];
    };
    onConfirm: () => void;
    onCancel: () => void;
};

export default function SeasonConfirmationModal({ seasonData, onConfirm, onCancel }: SeasonConfirmationModalProps) {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                    Confirm Season Creation
                </h2>
                <div className="space-y-4 text-gray-700 dark:text-gray-300">
                    <p><strong>Season Name:</strong> {seasonData.name}</p>
                    <p><strong>Start Date:</strong> {new Date(seasonData.startDate).toLocaleDateString()}</p>
                    <p><strong>End Date:</strong> {new Date(seasonData.endDate).toLocaleDateString()}</p>
                    <div>
                        <strong>Players:</strong>
                        <ul className="mt-2 ml-4 list-disc">
                            {seasonData.players.map(player => (
                                <li key={player.id}>{player.username}</li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}