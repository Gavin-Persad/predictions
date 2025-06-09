//src/app/viewseason/components/georgeCup/TournamentLogic.ts

export function calculateRequiredRounds(playerCount: number): number {
  return Math.ceil(Math.log2(playerCount));
}

export function calculateByesNeeded(playerCount: number): number {
  const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(playerCount)));
  return nextPowerOfTwo - playerCount;
}

export function distributeByes(players: any[], byesNeeded: number): (any | 'BYE')[] {
  // Create player slots with BYEs
  const totalSlots = players.length + byesNeeded;
  const slots = [...players];
  
  // Add required BYEs
  for (let i = 0; i < byesNeeded; i++) {
    slots.push('BYE');
  }
  
  // Shuffle to randomize BYE positions (Fisher-Yates algorithm)
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]]; // Swap elements
  }
  
  return slots;
}

export function determineWinner(
  player1: { id: string; score: number; correctScores: number } | null,
  player2: { id: string; score: number; correctScores: number } | null
): string | null {
  // Handle BYE cases
  if (!player1 && player2) return player2.id;
  if (player1 && !player2) return player1.id;
  if (!player1 && !player2) return null;
  
  // Since both players exist now, compare scores
  if (player1.score > player2.score) return player1.id;
  if (player2.score > player1.score) return player2.id;
  
  // If scores are tied, compare correct scores
  if (player1.correctScores > player2.correctScores) return player1.id;
  if (player2.correctScores > player1.correctScores) return player2.id;
  
  // If still tied, return null (will be handled with coin flip later)
  return null;
}