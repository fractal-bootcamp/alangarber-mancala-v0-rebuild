"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { GameBoard } from "@/components/game-board"
import { GameMode } from "@/components/game-mode"
import { useToast } from "@/hooks/use-toast"
import { GameOverModal } from "@/components/game-over-modal"
import { OpponentDisconnectedModal } from "@/components/opponent-disconnected-modal"
import { makeMove, findBestMove, getMoveDescription } from "@/lib/game-logic"
import { useGameState } from "@/hooks/use-game-state"
import { AnimatePresence, motion } from "framer-motion"
import { useSocket } from "@/hooks/use-socket"
import { Loader2, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface MancalaGameProps {
  forceGameMode?: "single" | "computer" | "multiplayer"
}

export function MancalaGame({ forceGameMode }: MancalaGameProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [gameMode, setGameMode] = useState<"single" | "computer" | "multiplayer" | null>(null)
  const [showGameOver, setShowGameOver] = useState(false)
  const [showOpponentDisconnected, setShowOpponentDisconnected] = useState(false)
  const [gameResult, setGameResult] = useState<{
    winner: "player1" | "player2" | "tie" | null
    message: string
  }>({ winner: null, message: "" })
  const [moveDescription, setMoveDescription] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [selectedPocketIndex, setSelectedPocketIndex] = useState<number | null>(null)
  const [gameStatus, setGameStatus] = useState<string>("")
  const [waitingTime, setWaitingTime] = useState(30)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const gameModeInitialized = useRef(false)

  // Animation duration in milliseconds - increased for slower animations
  const ANIMATION_DURATION = 2500

  const {
    board: gameStateBoard,
    currentPlayer: gameStateCurrentPlayer,
    gameOver,
    winner,
    gameMode: savedGameMode,
    initializeGame,
    updateGameState,
    resetGame,
    setCurrentPlayer,
    setBoard,
    setGameMode: setStoredGameMode,
  } = useGameState()

  // Socket hook for multiplayer
  const {
    status: socketStatus,
    isFirstPlayer,
    board: socketBoard,
    currentPlayer: socketCurrentPlayer,
    lastMove,
    opponentDisconnected,
    joinGame,
    makeMove: makeSocketMove,
    leaveGame,
  } = useSocket()

  // Use the appropriate board and currentPlayer based on game mode
  const board = gameMode === "multiplayer" ? socketBoard || gameStateBoard : gameStateBoard
  const currentPlayer =
    gameMode === "multiplayer" ? socketCurrentPlayer || gameStateCurrentPlayer : gameStateCurrentPlayer

  // Initialize game from localStorage or forceGameMode
  useEffect(() => {
    if (gameModeInitialized.current) return

    if (forceGameMode) {
      setGameMode(forceGameMode)
      gameModeInitialized.current = true
    } else {
      const savedGameMode = localStorage.getItem("mancalaGameMode") as "single" | "computer" | "multiplayer" | null
      if (savedGameMode && !gameMode) {
        setGameMode(savedGameMode)
        gameModeInitialized.current = true
      }
    }
  }, [forceGameMode, gameMode])

  // Load saved game state for single player and computer modes
  useEffect(() => {
    if (!gameMode || gameMode === "multiplayer") return

    // If we have a saved game mode and it matches the current mode, use the saved state
    if (savedGameMode === gameMode) {
      // Set appropriate game status message
      if (gameMode === "single") {
        setGameStatus("Continuing your game against yourself")
      } else if (gameMode === "computer") {
        setGameStatus("Continuing your game against the computer")
      }
    } else {
      // No saved game or different mode, initialize a new one
      initializeGame(gameMode)
      setStoredGameMode(gameMode)

      // Set game status message
      if (gameMode === "single") {
        setGameStatus("You have started a new game against yourself")
      } else if (gameMode === "computer") {
        setGameStatus("You have started a new game against the computer")
      }
    }
  }, [gameMode, savedGameMode, initializeGame, setStoredGameMode])

  // Initialize the multiplayer game
  useEffect(() => {
    if (gameMode !== "multiplayer") return

    // For multiplayer, we'll join the waiting room
    joinGame()
    setGameStatus("Waiting for another player to join...")

    // Start the countdown timer
    setWaitingTime(30)
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    timerRef.current = setInterval(() => {
      setWaitingTime((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      // Clean up timer when component unmounts or game mode changes
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [gameMode, joinGame])

  // Handle socket status changes
  useEffect(() => {
    if (gameMode !== "multiplayer") return

    if (socketStatus === "matched") {
      // We've been matched with another player
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      setGameStatus(
        `You have started a new game against another player (${isFirstPlayer ? "You are Player 1" : "You are Player 2"})`,
      )

      // If we have a board from the socket, use it
      if (socketBoard) {
        setBoard(socketBoard)
      }
    } else if (socketStatus === "timeout") {
      setGameStatus("Sorry, no opponent is available at this time.")
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [socketStatus, isFirstPlayer, socketBoard, setBoard, gameMode])

  // Update board and current player from socket
  useEffect(() => {
    if (gameMode !== "multiplayer") return

    if (socketBoard) {
      setBoard(socketBoard)
    }

    if (socketCurrentPlayer) {
      setCurrentPlayer(socketCurrentPlayer)
    }

    // Update move description from last move
    if (lastMove) {
      setMoveDescription(lastMove.description)
    }
  }, [gameMode, socketBoard, socketCurrentPlayer, lastMove, setBoard, setCurrentPlayer])

  // Handle opponent disconnection
  useEffect(() => {
    if (opponentDisconnected && !showOpponentDisconnected) {
      setShowOpponentDisconnected(true)
    }
  }, [opponentDisconnected, showOpponentDisconnected])

  // Handle game over state
  useEffect(() => {
    if (gameOver && !showGameOver) {
      let message = ""
      if (winner === "player1") {
        message = gameMode === "multiplayer" && !isFirstPlayer ? "Your opponent won the game!" : "You won the game!"
      } else if (winner === "player2") {
        message =
          gameMode === "computer"
            ? "Computer won the game!"
            : gameMode === "multiplayer" && isFirstPlayer
              ? "Your opponent won the game!"
              : "Player 2 won the game!"
      } else {
        message = "The game ended in a tie!"
      }

      setGameResult({
        winner,
        message,
      })
      setShowGameOver(true)
    }
  }, [gameOver, winner, showGameOver, gameMode, isFirstPlayer])

  // Clear move description after a delay
  useEffect(() => {
    if (!moveDescription) return

    const timer = setTimeout(() => {
      setMoveDescription(null)
    }, ANIMATION_DURATION + 1000) // Keep description visible a bit longer than the animation

    return () => clearTimeout(timer)
  }, [moveDescription, ANIMATION_DURATION])

  // Reset selected pocket when animation completes
  useEffect(() => {
    if (!isAnimating) {
      setSelectedPocketIndex(null)
    }
  }, [isAnimating])

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      if (gameMode === "multiplayer") {
        leaveGame()
      }

      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [gameMode, leaveGame])

  const handlePocketClick = useCallback(
    (index: number) => {
      if (gameOver || isAnimating) return

      // For multiplayer, check if it's the player's turn
      if (gameMode === "multiplayer") {
        const isMyTurn = currentPlayer === (isFirstPlayer ? "player1" : "player2");
        if (!isMyTurn) {
          toast({
            title: "Not your turn",
            description: "Please wait for your opponent to make a move.",
            variant: "destructive",
          });
          return;
        }

        // For multiplayer, send the move to the server
        if (makeSocketMove(index)) {
          // The move will be processed by the server and reflected in the game state
          setIsAnimating(true)
          setSelectedPocketIndex(index)

          // Animation will be handled by the server response
          setTimeout(() => {
            setIsAnimating(false)
          }, ANIMATION_DURATION)
        }

        return
      }

      // Local game logic for single player and computer modes
      // Check if it's a valid move
      if (
        (currentPlayer === "player1" && index >= 0 && index < 6 && board[index] > 0) ||
        (currentPlayer === "player2" && index >= 7 && index < 13 && board[index] > 0)
      ) {
        setIsAnimating(true)
        setSelectedPocketIndex(index)

        // Make the move and get information about it
        const { newBoard, lastStoneIndex, capturedStones } = makeMove(board, index, currentPlayer)

        // Get move description and next player
        const { description, nextPlayer } = getMoveDescription(
          board,
          index,
          currentPlayer,
          lastStoneIndex,
          capturedStones,
        )

        setMoveDescription(description)

        // Delay the state update to allow for animation
        setTimeout(() => {
          updateGameState(newBoard)

          // Set the next player based on the move result
          setCurrentPlayer(nextPlayer)

          setIsAnimating(false)
        }, ANIMATION_DURATION) // This should match the total animation duration
      } else {
        toast({
          title: "Invalid move",
          description: "You can only select your own non-empty pockets.",
          variant: "destructive",
        })
      }
    },
    [
      gameOver,
      isAnimating,
      gameMode,
      isFirstPlayer,
      currentPlayer,
      makeSocketMove,
      board,
      updateGameState,
      setCurrentPlayer,
      toast,
      ANIMATION_DURATION,
    ],
  )

  // Computer's turn logic
  useEffect(() => {
    if (gameMode !== "computer" || currentPlayer !== "player2" || gameOver || isAnimating) return

    const timer = setTimeout(() => {
      const bestMoveIndex = findBestMove(board, currentPlayer)
      if (bestMoveIndex !== -1) {
        handlePocketClick(bestMoveIndex)
      }
    }, 1000) // Add a small delay to make it feel more natural

    return () => clearTimeout(timer)
  }, [board, currentPlayer, gameMode, gameOver, isAnimating, handlePocketClick])

  const handleNewGame = useCallback(
    (keepSettings: boolean) => {
      if (keepSettings) {
        if (gameMode === "multiplayer") {
          // For multiplayer, we need to leave the current game and join a new one
          leaveGame()
          joinGame()
          setGameStatus("Waiting for another player to join...")

          // Reset the timer
          setWaitingTime(30)
          if (timerRef.current) {
            clearInterval(timerRef.current)
          }

          timerRef.current = setInterval(() => {
            setWaitingTime((prev) => {
              if (prev <= 1) {
                if (timerRef.current) clearInterval(timerRef.current)
                return 0
              }
              return prev - 1
            })
          }, 1000)
        } else {
          resetGame()
          // Clear saved game state
          localStorage.removeItem(`mancalaGameState-${gameMode}`)
        }

        setShowGameOver(false)

        // Update game status message for non-multiplayer modes
        if (gameMode === "single") {
          setGameStatus("You have started a new game against yourself")
        } else if (gameMode === "computer") {
          setGameStatus("You have started a new game against the computer")
        }
      } else {
        if (gameMode === "multiplayer") {
          leaveGame()
        }

        // Clear saved game state
        if (gameMode) {
          localStorage.removeItem(`mancalaGameState-${gameMode}`)
        }

        setGameMode(null)
        gameModeInitialized.current = false
        setShowGameOver(false)
        setGameStatus("")

        // Clear the stored game mode
        localStorage.removeItem("mancalaGameMode")
      }
    },
    [gameMode, leaveGame, joinGame, resetGame],
  )

  const handleReturnHome = useCallback(() => {
    // First, leave the game if in multiplayer mode
    if (gameMode === "multiplayer") {
      leaveGame()
    }

    // Clear saved game state
    if (gameMode) {
      localStorage.removeItem(`mancalaGameState-${gameMode}`)
    }

    // Clear the stored game mode in localStorage
    localStorage.removeItem("mancalaGameMode")

    // Navigate to home page
    router.push("/")
  }, [gameMode, leaveGame, router])

  const handleOpponentDisconnectedClose = useCallback(() => {
    setShowOpponentDisconnected(false)
    handleReturnHome()
  }, [handleReturnHome])

  if (!gameMode) {
    return <GameMode onSelectMode={setGameMode} />
  }

  // Show waiting screen for multiplayer
  if (gameMode === "multiplayer" && (socketStatus === "waiting" || socketStatus === "timeout")) {
    return (
      <div className="flex flex-col items-center w-full max-w-3xl">
        <h1 className="text-4xl font-bold mb-2 text-slate-800">Mancala</h1>

        {socketStatus === "waiting" ? (
          <div className="bg-amber-50 rounded-xl p-8 shadow-lg w-full text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-12 w-12 text-amber-500 animate-spin" />
              <h2 className="text-xl font-semibold text-slate-800">Waiting for an opponent...</h2>
              <p className="text-slate-600">
                This could take a moment. We&apos;ll connect you as soon as another player joins.
              </p>

              <div className="mt-4 text-amber-600 font-medium">Timeout in: {waitingTime} seconds</div>

              <Button onClick={handleReturnHome} variant="outline" className="mt-6">
                Cancel and Return Home
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 rounded-xl p-8 shadow-lg w-full text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <AlertCircle className="h-12 w-12 text-amber-500" />
              <h2 className="text-xl font-semibold text-slate-800">No opponent available</h2>
              <p className="text-slate-600">Sorry, we couldn&apos;t find an opponent for you at this time.</p>

              <div className="flex space-x-4 mt-6">
                <Button onClick={() => joinGame()} variant="default">
                  Try Again
                </Button>
                <Button onClick={handleReturnHome} variant="outline">
                  Return Home
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center w-full max-w-3xl">
      <h1 className="text-4xl font-bold mb-2 text-slate-800">Mancala</h1>

      {gameStatus && <p className="text-slate-600 mb-6">{gameStatus}</p>}

      <div className="mb-4 w-full flex justify-between items-center">
        <div className="text-lg font-medium">
          {currentPlayer === "player1"
            ? gameMode === "multiplayer" && !isFirstPlayer
              ? "Opponent's Turn"
              : "Player 1's Turn"
            : gameMode === "computer"
              ? "Computer's Turn"
              : gameMode === "multiplayer" && isFirstPlayer
                ? "Opponent's Turn"
                : "Player 2's Turn"}
        </div>
        <Button variant="outline" onClick={() => handleNewGame(false)}>
          New Game
        </Button>
      </div>

      <GameBoard
        board={board}
        currentPlayer={currentPlayer}
        onPocketClick={handlePocketClick}
        isAnimating={isAnimating}
        selectedPocket={selectedPocketIndex}
      />

      {/* Move description with fade effect */}
      <div className="h-12 mt-4 flex items-center justify-center">
        <AnimatePresence>
          {moveDescription && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="text-slate-600 italic text-center"
            >
              {moveDescription}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showGameOver && (
        <GameOverModal
          result={gameResult}
          onNewGame={() => handleNewGame(true)}
          onRestart={() => handleNewGame(false)}
          onClose={() => setShowGameOver(false)}
        />
      )}

      {showOpponentDisconnected && (
        <OpponentDisconnectedModal
          message="Your opponent has left the game. You win by forfeit!"
          onClose={handleOpponentDisconnectedClose}
        />
      )}
    </div>
  )
}
