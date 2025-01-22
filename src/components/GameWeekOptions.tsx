//src/components/GameWeekOptions.tsx

"use client";

type GameWeekOptionsProps = {
  onCreateClick: () => void;
  onEditClick: () => void;
  onClose: () => void;
};

export default function GameWeekOptions({ onCreateClick, onEditClick, onClose }: GameWeekOptionsProps) {
  return (
    <div className="flex flex-col items-center w-full">
      <button
        onClick={onClose}
        className="absolute top-4 left-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
      >
        Back to Season
      </button>
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Game Week Management</h2>
      <div className="flex space-x-4">
        <button
          onClick={onCreateClick}
          className="px-6 py-2 w-40 text-base bg-green-600 text-white rounded hover:bg-green-700 transition duration-300"
        >
          Create Game Week
        </button>
        <button
          onClick={onEditClick}
          className="px-6 py-2 w-40 text-base bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300"
        >
          Edit Game Week
        </button>
      </div>
    </div>
  );
}