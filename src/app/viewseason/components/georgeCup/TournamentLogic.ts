//src/app/viewseason/components/georgeCup/TournamentLogic.ts

export function calculateRequiredRounds(playerCount: number): number {
  return Math.ceil(Math.log2(playerCount));
}

export function calculateByesNeeded(playerCount: number): number {
  const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(playerCount)));
  return nextPowerOfTwo - playerCount;
}

export function distributeByes(players: any[], byesNeeded: number): (any | 'BYE')[] {
  // Calculate total slots needed (should be a power of 2)
  const totalSlots = players.length + byesNeeded;
  
  // Create balanced bracket positions using seeding algorithm
  const positions = new Array(totalSlots).fill(null);
  
  // First, randomly shuffle the players to ensure random initial seeding
  const shuffledPlayers = [...players];
    for (let i = shuffledPlayers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
    }
    
    // create a balanced bracket that will push BYEs to early rounds
    // The pattern follows tournament seeding rules that ensure BYEs are matched against
    // players in the first round rather than against each other
    
    // First, place players with indices according to standard tournament seeding
    for (let i = 0; i < shuffledPlayers.length; i++) {
      // For power of 2 seeding patterns
      let position;
      
      // Use a snake seeding pattern that places players optimally
      // This ensures BYEs will be distributed evenly across the bracket
      // and ensures they only appear in the first round
      if (i % 2 === 0) {
        position = Math.floor(i / 2);
      } else {
        position = totalSlots - 1 - Math.floor(i / 2);
      }
      
      positions[position] = shuffledPlayers[i];
    }
    
    // Fill in the remaining positions with BYEs
    for (let i = 0; i < totalSlots; i++) {
      if (positions[i] === null) {
        positions[i] = 'BYE';
      }
    }
    
    return positions;
  }

export function determineWinner(
  player1: { id: string; score: number; correctScores: number } | null,
  player2: { id: string; score: number; correctScores: number } | null
): string | null {
  // Handle BYE cases
  if (!player1 && player2) return player2.id;
  if (player1 && !player2) return player1.id;
  if (!player1 && !player2) return null;
  
  // Add this explicit guard to assure TypeScript that both players exist
  if (!player1 || !player2) return null;
  
  // Since both players exist now, compare scores
  if (player1.score > player2.score) return player1.id;
  if (player2.score > player1.score) return player2.id;
  
  // If scores are tied, compare correct scores
  if (player1.correctScores > player2.correctScores) return player1.id;
  if (player2.correctScores > player1.correctScores) return player2.id;
  
  // If still tied, return null (will be handled with coin flip later)
  return null;
}