// src/components/LeagueTable.tsx

export default function LeagueTable() {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800">
          <thead>
            <tr>
              <th className="py-2 text-gray-700 dark:text-gray-300">Username</th>
              <th className="py-2 text-gray-700 dark:text-gray-300">Club</th>
              <th className="py-2 text-gray-700 dark:text-gray-300">Correct Scores</th>
              <th className="py-2 text-gray-700 dark:text-gray-300">Points</th>
            </tr>
          </thead>
          <tbody>
            {/* Placeholder for league table data */}
            <tr>
              <td className="py-2 text-gray-900 dark:text-gray-100">-</td>
              <td className="py-2 text-gray-900 dark:text-gray-100">-</td>
              <td className="py-2 text-gray-900 dark:text-gray-100">-</td>
              <td className="py-2 text-gray-900 dark:text-gray-100">-</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }