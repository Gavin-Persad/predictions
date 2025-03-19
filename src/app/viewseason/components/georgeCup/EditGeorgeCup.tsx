interface Props {
    seasonId: string;
    onClose: () => void;
}

export default function EditGeorgeCup({ seasonId, onClose }: Props) {
    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    George Cup
                </h2>
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
                >
                    Back
                </button>
            </div>
        </div>
    );
}