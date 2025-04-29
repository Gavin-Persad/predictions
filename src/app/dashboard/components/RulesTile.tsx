//src/app/dashboard/components/RulesTile.tsx

import React from 'react';
import Link from 'next/link';

export default function RulesTile() {
  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Rules</h2>
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Predict fixture scores, compete in knockout tournaments, and participate in the team selection cup.
        </p>
        <ul className="list-disc ml-5 mb-4 text-gray-700 dark:text-gray-300">
          <li>League Points: Score points for correct predictions</li>
          <li>George Cup: Head-to-head weekly prediction battles</li>
          <li>Lavery Cup: Select winning teams each round</li>
        </ul>
        <div className="text-center mt-4">
          <Link 
            href="/rules" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Full Rules & Competition Format
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}