//src/components/ConfirmationModal.tsx

type ConfirmationModalProps = {
    gameWeekData: {
        predictionsOpen: string;
        predictionsClose: string;
        liveStart: string;
        liveEnd: string;
        fixtures: Array<{number: number, home: string, away: string}>;
    };
    onConfirm: () => void;
    onCancel: () => void;
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export default function ConfirmationModal({ gameWeekData, onConfirm, onCancel }: ConfirmationModalProps) {
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-8 border w-[90%] max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Confirm Game Week Details</h2>
                
                <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Predictions Open:</p>
                            <p className="text-gray-900 dark:text-gray-100">{formatDate(gameWeekData.predictionsOpen)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Predictions Close:</p>
                            <p className="text-gray-900 dark:text-gray-100">{formatDate(gameWeekData.predictionsClose)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Live Start:</p>
                            <p className="text-gray-900 dark:text-gray-100">{formatDate(gameWeekData.liveStart)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Live End:</p>
                            <p className="text-gray-900 dark:text-gray-100">{formatDate(gameWeekData.liveEnd)}</p>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-gray-100">Fixtures</h3>
                    <div className="space-y-2">
                        {gameWeekData.fixtures.map((fixture, index) => (
                            <div key={index} className="grid grid-cols-3 gap-4 py-2">
                                <div className="text-right text-gray-900 dark:text-gray-100">{fixture.home}</div>
                                <div className="text-center text-gray-500">vs</div>
                                <div className="text-left text-gray-900 dark:text-gray-100">{fixture.away}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}