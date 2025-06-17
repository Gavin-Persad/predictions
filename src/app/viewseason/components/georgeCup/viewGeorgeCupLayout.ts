//src/app/viewseason/components/georgeCup/viewGeorgeCup.tsx

type PlayerBoxStyles = {
    base: string;
    winner: string;
    loser: string;
    bye: string;
    score: string;
    eliminated: string;
    currentUser: string;
}

type LayoutStyles = {
    container: string;
    column: string;
    roundTitle: string;
    fixtureBox: string;
    pastRound: string;
    activeRound: string;
    playerBox: PlayerBoxStyles;
    scrollContainer: string;
    winnerColumn: string;
}

export const Layout: LayoutStyles = {
    container: "flex flex-row space-x-4 overflow-x-auto p-4 pb-0 h-[calc(100vh-120px)]",
    column: "min-w-[250px] flex-shrink-0 flex flex-col h-full",
    roundTitle: "text-lg font-bold mb-2 text-gray-900 dark:text-gray-100 sticky top-0 bg-white dark:bg-gray-800 py-2 z-10",    fixtureBox: "border rounded p-3 mb-2 bg-gray-200 dark:bg-gray-700",
    fixtureBox: "border rounded p-3 mb-2 bg-gray-200 dark:bg-gray-700",
    pastRound: "bg-gray-100 dark:bg-gray-700/50",
    activeRound: "bg-white dark:bg-gray-800",
        scrollContainer: "overflow-y-auto flex-grow max-h-[calc(100%-40px)]",
    playerBox: {
        base: "flex justify-between items-center p-2 rounded text-gray-900 dark:text-gray-100",
        winner: "bg-green-100 dark:bg-green-900",
        loser: "bg-red-100 dark:bg-red-900",
        bye: "bg-gray-200 dark:bg-gray-600 italic",
        score: "ml-2 font-bold",
        eliminated: "line-through opacity-60",
        currentUser: "border-2 border-blue-500"
    },
    winnerColumn: "bg-gray-50 dark:bg-gray-800/80 border-l border-gray-200 dark:border-gray-700"
};