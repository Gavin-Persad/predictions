// src/app/viewseason/components/georgeCup/components/DrawModal.tsx

import React from 'react';

type DrawConfirmationModalProps = {
  roundName: string;
  gameWeekNumber: number;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function DrawConfirmationModal({
  roundName,
  gameWeekNumber,
  onConfirm,
  onCancel
}: DrawConfirmationModalProps): JSX.Element {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 className="text-lg font-bold mb-4">Confirm Draw</h3>
        
        <p className="mb-6">
          Are you sure you want to draw fixtures for <strong>{roundName}</strong> using 
          Game Week <strong>{gameWeekNumber}</strong>?
        </p>
        
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Draw Fixtures
          </button>
        </div>
      </div>
    </div>
  );
}