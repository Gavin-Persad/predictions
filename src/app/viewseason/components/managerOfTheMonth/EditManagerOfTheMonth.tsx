import Sidebar from '../../../../components/Sidebar';
import DarkModeToggle from '../../../../components/darkModeToggle';
import { supabase } from '../../../../../supabaseClient';
import React from 'react';

type Props = {
  seasonId: string;
  onClose: () => void;
};

export default function ViewManagerOfTheMonth({ seasonId, onClose }: Props) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-grow flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="absolute top-4 right-4">
          <DarkModeToggle />
        </div>

        <div className="w-full max-w-4xl mx-auto px-[5%]">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Manager of the Month</h2>
          <button
            onClick={onClose}
            className="mb-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
          >
            Back
          </button>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-gray-700 dark:text-gray-300">
            <p className="mb-2">Placeholder view for Manager of the Month.</p>
            <p>Season ID: {seasonId}</p>
            <p className="mt-4">This will be replaced by the interactive table showing player ups/downs.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
