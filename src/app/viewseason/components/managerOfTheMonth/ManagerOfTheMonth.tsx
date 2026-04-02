import Sidebar from '../../../../components/Sidebar';
import DarkModeToggle from '../../../../components/darkModeToggle';
import React from 'react';

type Props = {
  seasonId: string;
  onClose: () => void;
};

export default function ManagerOfTheMonth({ seasonId, onClose }: Props) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-grow flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="absolute top-4 right-4">
          <DarkModeToggle />
        </div>

        <div className="w-full max-w-4xl mx-auto px-[5%]">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Edit Manager of the Month</h2>
          <button
            onClick={onClose}
            className="mb-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
          >
            Back
          </button>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-gray-700 dark:text-gray-300">
            <p className="mb-2">Admin placeholder for editing Manager of the Month.</p>
            <p>Season ID: {seasonId}</p>
            <p className="mt-4">Add controls here to select or update the Manager of the Month.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
