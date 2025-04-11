// Game logic for Mancala

// Create a new game with the initial board state
export function createGame(): number[] {
    // Standard Mancala setup: 4 stones in each pocket
    // Indices 0-5: Player 1's pockets
    // Index 6: Player 1's store
    // Indices 7-12: Player 2's pockets
    // Index 13: Player 2's store
    const board = Array(14).fill(4)
    board[6] = 0 // Player 1's store starts empty
    board[13] = 0 // Player 2's store starts empty
    return board
  }
  
  // Make a move and return the new board state and information about the move
  export function makeMove(
    board: number[],
    pocketIndex: number,
    currentPlayer: "player1" | "player2",
  ): { newBoard: number[]; lastStoneIndex: number; capturedStones: number } {
    // Create a copy of the board
    const newBoard = [...board]
  
    // Get the number of stones in the selected pocket
    let stones = newBoard[pocketIndex]
    newBoard[pocketIndex] = 0
  
    // Determine which store belongs to the current player
    const playerStore = currentPlayer === "player1" ? 6 : 13
    const opponentStore = currentPlayer === "player1" ? 13 : 6
  
    // Distribute the stones
    let currentIndex = pocketIndex
    let lastStoneIndex = -1
    let capturedStones = 0
  
    while (stones > 0) {
      currentIndex = (currentIndex + 1) % 14
  
      // Skip opponent's store
      if (currentIndex === opponentStore) {
        continue
      }
  
      // Add a stone to the current pocket
      newBoard[currentIndex]++
      stones--
  
      // Remember where the last stone landed
      if (stones === 0) {
        lastStoneIndex = currentIndex
      }
    }
  
    // Special rule: If the last stone lands in an empty pocket on the player's side,
    // capture that stone and all stones in the opposite pocket
    if (
      newBoard[lastStoneIndex] === 1 &&
      ((currentPlayer === "player1" && lastStoneIndex >= 0 && lastStoneIndex < 6) ||
        (currentPlayer === "player2" && lastStoneIndex >= 7 && lastStoneIndex < 13))
    ) {
      const oppositeIndex = 12 - lastStoneIndex
  
      // Only capture if there are stones in the opposite pocket
      if (newBoard[oppositeIndex] > 0) {
        capturedStones = newBoard[lastStoneIndex] + newBoard[oppositeIndex]
        newBoard[playerStore] += capturedStones
        newBoard[lastStoneIndex] = 0
        newBoard[oppositeIndex] = 0
      }
    }
  
    // Check if one side is empty, which means the game is over
    // If so, the player with stones remaining captures them all
    const player1Side = newBoard.slice(0, 6).every((count) => count === 0)
    const player2Side = newBoard.slice(7, 13).every((count) => count === 0)
  
    if (player1Side || player2Side) {
      // Player 1 captures all stones on their side
      if (!player1Side) {
        const stonesLeft = newBoard.slice(0, 6).reduce((sum, count) => sum + count, 0)
        newBoard[6] += stonesLeft
        for (let i = 0; i < 6; i++) {
          newBoard[i] = 0
        }
      }
  
      // Player 2 captures all stones on their side
      if (!player2Side) {
        const stonesLeft = newBoard.slice(7, 13).reduce((sum, count) => sum + count, 0)
        newBoard[13] += stonesLeft
        for (let i = 7; i < 13; i++) {
          newBoard[i] = 0
        }
      }
    }
  
    return { newBoard, lastStoneIndex, capturedStones }
  }
  
  // Generate a description of the move
  export function getMoveDescription(
    board: number[],
    pocketIndex: number,
    currentPlayer: "player1" | "player2",
    lastStoneIndex: number,
    capturedStones: number,
  ): { description: string; nextPlayer: "player1" | "player2" } {
    const stoneCount = board[pocketIndex]
    const playerName = currentPlayer === "player1" ? "Player 1" : "Player 2"
    const opponentName = currentPlayer === "player1" ? "Player 2" : "Player 1"
    const playerStore = currentPlayer === "player1" ? 6 : 13
  
    // Determine next player
    let nextPlayer = currentPlayer
    if (lastStoneIndex !== playerStore) {
      // If the last stone didn't land in the player's store, switch players
      nextPlayer = currentPlayer === "player1" ? "player2" : "player1"
    }
  
    // Basic move description
    let description = `${playerName} moved ${stoneCount} stones from pocket ${(pocketIndex % 7) + 1}.`
  
    // Check if the last stone landed in the player's store (extra turn)
    if (lastStoneIndex === playerStore) {
      description = `${playerName} gets another turn because the last stone landed in their store!`
    }
    // Check if there was a capture
    else if (capturedStones > 0) {
      description = `${playerName} captured ${capturedStones} stones by landing in an empty pocket!`
      if (nextPlayer !== currentPlayer) {
        description += ` It's now ${opponentName}'s turn.`
      }
    }
    // Regular turn change
    else if (nextPlayer !== currentPlayer) {
      description += ` It's now ${opponentName}'s turn.`
    }
  
    return { description, nextPlayer }
  }
  
  // Check if the game is over
  export function checkGameOver(board: number[]): boolean {
    const player1Side = board.slice(0, 6).every((count) => count === 0)
    const player2Side = board.slice(7, 13).every((count) => count === 0)
    return player1Side || player2Side
  }
  
  // Determine the winner
  export function determineWinner(board: number[]): "player1" | "player2" | "tie" {
    const player1Score = board[6]
    const player2Score = board[13]
  
    if (player1Score > player2Score) {
      return "player1"
    } else if (player2Score > player1Score) {
      return "player2"
    } else {
      return "tie"
    }
  }
  
  // Find the best move for the computer player using a simple minimax algorithm
  export function findBestMove(board: number[], player: "player1" | "player2"): number {
    const playerPockets = player === "player1" ? [0, 1, 2, 3, 4, 5] : [7, 8, 9, 10, 11, 12]
    let bestScore = Number.NEGATIVE_INFINITY
    let bestMove = -1
  
    // Try each possible move
    for (const pocket of playerPockets) {
      if (board[pocket] === 0) continue // Skip empty pockets
  
      // Make a copy of the board and simulate the move
      const { newBoard, lastStoneIndex } = makeMove([...board], pocket, player)
  
      // Check if this move gives an extra turn
      const playerStore = player === "player1" ? 6 : 13
      const extraTurn = lastStoneIndex === playerStore
  
      // Calculate a score for this move
      let score = evaluateBoard(newBoard, player)
  
      // Bonus for moves that give an extra turn
      if (extraTurn) {
        score += 5
      }
  
      if (score > bestScore) {
        bestScore = score
        bestMove = pocket
      }
    }
  
    return bestMove
  }
  
  // Evaluate the board state for the given player
  function evaluateBoard(board: number[], player: "player1" | "player2"): number {
    const playerStore = player === "player1" ? 6 : 13
    const opponentStore = player === "player1" ? 13 : 6
  
    // Simple evaluation: difference in scores
    const scoreDiff = board[playerStore] - board[opponentStore]
  
    // Count stones on player's side
    const playerSideStart = player === "player1" ? 0 : 7
    const playerSideEnd = player === "player1" ? 5 : 12
    const stonesOnPlayerSide = board.slice(playerSideStart, playerSideEnd + 1).reduce((sum, count) => sum + count, 0)
  
    // Bonus for having more stones on your side (control)
    return scoreDiff * 3 + stonesOnPlayerSide
  }
  