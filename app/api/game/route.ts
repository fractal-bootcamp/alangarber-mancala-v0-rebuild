import { NextResponse } from "next/server"

// In a real implementation, this would be a database
// For this demo, we'll use in-memory storage
let waitingPlayers: {
  connectionId: string
  timestamp: number
}[] = []

let activeGames: {
  gameId: string
  player1: string
  player2: string
  board: number[]
  currentPlayer: "player1" | "player2"
  lastUpdated: number
}[] = []

// Clean up stale connections every minute
setInterval(() => {
  const now = Date.now()

  // Remove waiting players who have been waiting for more than 2 minutes
  waitingPlayers = waitingPlayers.filter((player) => now - player.timestamp < 120000)

  // Remove games that haven't been updated in 10 minutes
  activeGames = activeGames.filter((game) => now - game.lastUpdated < 600000)
}, 60000)

export async function POST(request: Request) {
  const data = await request.json()
  const { action, connectionId, gameId, board } = data

  switch (action) {
    case "join": {
      // Generate a unique connection ID if not provided
      const playerId = connectionId || Math.random().toString(36).substring(2, 15)

      // Check if there's already a waiting player
      const waitingPlayer = waitingPlayers[0]

      if (waitingPlayer && waitingPlayer.connectionId !== playerId) {
        // Match with waiting player
        const newGameId = Math.random().toString(36).substring(2, 9)

        // Create a new game
        activeGames.push({
          gameId: newGameId,
          player1: waitingPlayer.connectionId,
          player2: playerId,
          board: Array(14)
            .fill(4)
            .map((val, i) => (i === 6 || i === 13 ? 0 : val)),
          currentPlayer: "player1",
          lastUpdated: Date.now(),
        })

        // Remove the waiting player
        waitingPlayers = waitingPlayers.filter((p) => p.connectionId !== waitingPlayer.connectionId)

        return NextResponse.json({
          status: "matched",
          gameId: newGameId,
          playerId,
          isFirstPlayer: false,
        })
      } else {
        // Add to waiting list if not already waiting
        if (!waitingPlayers.some((p) => p.connectionId === playerId)) {
          waitingPlayers.push({
            connectionId: playerId,
            timestamp: Date.now(),
          })
        }

        return NextResponse.json({
          status: "waiting",
          playerId,
        })
      }
    }

    case "check": {
      // Check if player is in an active game
      const game = activeGames.find((g) => g.player1 === connectionId || g.player2 === connectionId)

      if (game) {
        const isFirstPlayer = game.player1 === connectionId
        const opponentId = isFirstPlayer ? game.player2 : game.player1

        // Check if opponent has left the game (not in waiting players and not connected)
        const opponentLeft =
          !waitingPlayers.some((p) => p.connectionId === opponentId) &&
          !activeGames.some((g) => g.player1 === opponentId || g.player2 === opponentId)

        if (opponentLeft) {
          // Remove the game
          activeGames = activeGames.filter((g) => g.gameId !== game.gameId)

          return NextResponse.json({
            status: "opponent_left",
            message: "Your opponent has left the game. You win by forfeit!",
          })
        }

        return NextResponse.json({
          status: "matched",
          gameId: game.gameId,
          board: game.board,
          currentPlayer: game.currentPlayer,
          isFirstPlayer,
        })
      }

      // Check if still waiting
      const isWaiting = waitingPlayers.some((p) => p.connectionId === connectionId)

      if (isWaiting) {
        return NextResponse.json({
          status: "waiting",
        })
      }

      return NextResponse.json({
        status: "not_found",
      })
    }

    case "move": {
      // Find the game
      const gameIndex = activeGames.findIndex((g) => g.gameId === gameId)

      if (gameIndex === -1) {
        return NextResponse.json({
          status: "error",
          message: "Game not found",
        })
      }

      const game = activeGames[gameIndex]

      // Verify it's the player's turn
      const isFirstPlayer = game.player1 === connectionId
      const playerRole = isFirstPlayer ? "player1" : "player2"

      if (game.currentPlayer !== playerRole) {
        return NextResponse.json({
          status: "error",
          message: "Not your turn",
        })
      }

      // Update the game state
      activeGames[gameIndex] = {
        ...game,
        board,
        currentPlayer: game.currentPlayer === "player1" ? "player2" : "player1",
        lastUpdated: Date.now(),
      }

      return NextResponse.json({
        status: "success",
        board,
        currentPlayer: activeGames[gameIndex].currentPlayer,
      })
    }

    case "leave": {
      // Remove from waiting list
      waitingPlayers = waitingPlayers.filter((p) => p.connectionId !== connectionId)

      // Find any active games this player is in
      const playerGames = activeGames.filter((g) => g.player1 === connectionId || g.player2 === connectionId)

      // End any active games
      activeGames = activeGames.filter((g) => g.player1 !== connectionId && g.player2 !== connectionId)

      return NextResponse.json({
        status: "success",
        gamesEnded: playerGames.length,
      })
    }

    default:
      return NextResponse.json({
        status: "error",
        message: "Invalid action",
      })
  }
}

export async function GET() {
  // For debugging purposes
  return NextResponse.json({
    waitingPlayers: waitingPlayers.length,
    activeGames: activeGames.length,
  })
}
