"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { GameBoard } from "@/components/game-board"
import { GameMode } from "@/components/game-mode"
import { WaitingScreen } from "@/components/waiting-screen"
import { TimeoutScreen } from "@/components/timeout-screen"
import { useToast } from "@/hooks/use-toast"
import { GameOverModal } from "@/components/game-over-modal"
import { OpponentDisconnectedModal } from "@/components/opponent-disconnected-modal"
import { makeMove, findBestMove, getMoveDescription } from "@/lib/game-logic"
import { useGameState } from "@/hooks/use-game-state"
import { AnimatePresence, motion } from "framer-motion"
import { useSocket } from "@/hooks/use-socket"
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
  const [gameResult, setGameResult] = useState<{ winner: "player1" | "player2" | "tie" | null, message: string }>({ winner: null, message: "" })
  const [moveDescription, setMoveDescription] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [selectedPocketIndex, setSelectedPocketIndex] = useState<number | null>(null)
  const [waitingTime, setWaitingTime] = useState(30)
  const [hasGameStarted, setHasGameStarted] = useState(false)
  const [isResetting, setIsResetting] = useState(false)  // <-- NEW!

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const gameModeInitialized = useRef(false)
  const previousGameMode = useRef<"single" | "computer" | "multiplayer" | null>(null)

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

  const {
    status: socketStatus,
    isFirstPlayer,
    board: socketBoard,
    currentPlayer: socketCurrentPlayer,
    lastMove,
    joinGame,
    makeMove: makeSocketMove,
    leaveGame,
    isConnected,
    opponentDisconnected,
  } = useSocket()

  const board = gameMode === "multiplayer" ? socketBoard || gameStateBoard : gameStateBoard
  const currentPlayer = gameMode === "multiplayer" ? socketCurrentPlayer : gameStateCurrentPlayer
  const boardReady = gameMode !== "multiplayer" || (socketStatus === "matched" && socketBoard && socketCurrentPlayer)

  // ========= Initialization Effects =========

  useEffect(() => {
    if (gameModeInitialized.current) return

    if (forceGameMode) {
      setGameMode(forceGameMode)
    } else {
      const saved = localStorage.getItem("mancalaGameMode") as "single" | "computer" | "multiplayer" | null
      if (saved) setGameMode(saved)
    }
    gameModeInitialized.current = true
  }, [forceGameMode])

  useEffect(() => {
    if (!gameModeInitialized.current || !gameMode) return

    const prev = previousGameMode.current
    if (prev && prev !== gameMode) {
      setIsResetting(true)

      setTimeout(() => {
        if (prev === "multiplayer") {
          leaveGame()
        }
        localStorage.removeItem(`mancalaGameState-${prev}`)

        if (gameMode !== "multiplayer") {
          initializeGame(gameMode)
          setStoredGameMode(gameMode)
        }

        setIsResetting(false)
      }, 400)
    } else {
      if (gameMode !== "multiplayer") {
        initializeGame(gameMode)
        setStoredGameMode(gameMode)
      }
    }

    previousGameMode.current = gameMode
    localStorage.setItem("mancalaGameMode", gameMode)
  }, [gameMode, leaveGame, initializeGame, setStoredGameMode])

  useEffect(() => {
    if (!gameMode || gameMode === "multiplayer") return

    if (savedGameMode !== gameMode) {
      initializeGame(gameMode)
      setStoredGameMode(gameMode)
    }
  }, [gameMode, savedGameMode, initializeGame, setStoredGameMode])

  useEffect(() => {
    if (gameMode !== "multiplayer" || !isConnected) return

    joinGame()
    setWaitingTime(30)

    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setWaitingTime(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timerRef.current!)
  }, [gameMode, isConnected, joinGame])

  useEffect(() => {
    if (gameMode !== "multiplayer") return
    if (socketStatus === "matched") {
      clearInterval(timerRef.current!)
    }
  }, [socketStatus, gameMode])

  useEffect(() => {
    if (gameMode !== "multiplayer") return

    if (socketBoard) setBoard(socketBoard)
    if (socketCurrentPlayer) setCurrentPlayer(socketCurrentPlayer)
    if (lastMove) {
      setMoveDescription(lastMove.description)
      setHasGameStarted(true)
    }
  }, [gameMode, socketBoard, socketCurrentPlayer, lastMove, setBoard, setCurrentPlayer])

  useEffect(() => {
    if (opponentDisconnected && !showOpponentDisconnected) {
      setShowOpponentDisconnected(true)
    }
  }, [opponentDisconnected, showOpponentDisconnected])

  // ========= Game Logic =========

  const handlePocketClick = useCallback((index: number) => {
    if (gameOver || isAnimating) return

    if (!board || board.length !== 14) {
      console.warn("Board not ready yet. Ignoring move.")
      return
    }

    if (gameMode === "multiplayer") {
      const isMyTurn = currentPlayer === (isFirstPlayer ? "player1" : "player2")
      if (!isMyTurn) {
        toast({ title: "Not your turn", description: "Please wait for your opponent.", variant: "destructive" })
        return
      }
      if (makeSocketMove(index)) {
        setIsAnimating(true)
        setSelectedPocketIndex(index)
        setTimeout(() => setIsAnimating(false), 2500)
      }
      return
    }

    if ((currentPlayer === "player1" && index >= 0 && index < 6 && board[index] > 0) ||
        (currentPlayer === "player2" && index >= 7 && index < 13 && board[index] > 0)) {
      setIsAnimating(true)
      setSelectedPocketIndex(index)

      const { newBoard, lastStoneIndex, capturedStones } = makeMove(board, index, currentPlayer)
      const { description, nextPlayer } = getMoveDescription(board, index, currentPlayer, lastStoneIndex, capturedStones)

      setMoveDescription(description)

      setTimeout(() => {
        updateGameState(newBoard)
        setCurrentPlayer(nextPlayer)
        setIsAnimating(false)
      }, 2500)
    } else {
      toast({ title: "Invalid move", description: "Select your own non-empty pocket.", variant: "destructive" })
    }
  }, [gameOver, isAnimating, gameMode, currentPlayer, isFirstPlayer, board, makeSocketMove, updateGameState, setCurrentPlayer, toast])

  useEffect(() => {
    if (gameMode === "computer" && currentPlayer === "player2" && !gameOver && !isAnimating) {
      const timer = setTimeout(() => {
        const move = findBestMove(board, currentPlayer)
        if (move !== -1) handlePocketClick(move)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [board, currentPlayer, gameMode, gameOver, isAnimating, handlePocketClick])

  const handleNewGame = useCallback((keepSettings: boolean) => {
    if (keepSettings) {
      if (gameMode === "multiplayer") {
        leaveGame()
        joinGame()
      } else {
        resetGame()
        localStorage.removeItem(`mancalaGameState-${gameMode}`)
      }
      setShowGameOver(false)
      setGameResult({ winner: null, message: "" })
      setHasGameStarted(false)
    } else {
      if (gameMode === "multiplayer") leaveGame()
      if (gameMode) localStorage.removeItem(`mancalaGameState-${gameMode}`)
      setGameMode(null)
      gameModeInitialized.current = false
      setShowGameOver(false)
      setGameResult({ winner: null, message: "" })
      setHasGameStarted(false)
      localStorage.removeItem("mancalaGameMode")
    }
  }, [gameMode, leaveGame, joinGame, resetGame])

  const handleReturnHome = useCallback(() => {
    if (gameMode === "multiplayer") leaveGame()
    if (gameMode) localStorage.removeItem(`mancalaGameState-${gameMode}`)
    localStorage.removeItem("mancalaGameMode")
    router.push("/")
  }, [gameMode, leaveGame, router])

  const handleOpponentDisconnectedClose = useCallback(() => {
    setShowOpponentDisconnected(false)
    handleReturnHome()
  }, [handleReturnHome])

  useEffect(() => {
    if (gameOver && !showGameOver) {
      let message = ""
      if (winner === "player1") {
        message = gameMode === "multiplayer" && !isFirstPlayer
          ? "Your opponent won the game!"
          : "You won the game!"
      } else if (winner === "player2") {
        message = gameMode === "computer"
          ? "Computer won the game!"
          : gameMode === "multiplayer" && isFirstPlayer
            ? "Your opponent won the game!"
            : "Player 2 won the game!"
      } else {
        message = "The game ended in a tie!"
      }

      setGameResult({ winner, message })
      setShowGameOver(true)
    }
  }, [gameOver, winner, showGameOver, gameMode, isFirstPlayer])

  // ========= UI Conditions =========

  if (!gameMode) {
    return <GameMode onSelectMode={setGameMode} />
  }

  if (gameMode === "multiplayer" && socketStatus === "waiting") {
    return <WaitingScreen waitingTime={waitingTime} onCancel={handleReturnHome} />
  }

  if (gameMode === "multiplayer" && socketStatus === "timeout") {
    return <TimeoutScreen onRetry={joinGame} onCancel={handleReturnHome} />
  }

  return (
    <div className="flex flex-col items-center w-full max-w-3xl">
      <h1 className="text-4xl font-bold mb-2 text-slate-800">Mancala</h1>

      <div className="mb-4 w-full flex justify-between items-center">
        <div className="text-lg font-medium">
          {gameMode === "multiplayer" && !boardReady ? (
            "Board Loading..."
          ) : !hasGameStarted ? (
            "Player 1's Turn"
          ) : currentPlayer === "player1" ? (
            isFirstPlayer ? "Your Turn" : "Opponent's Turn"
          ) : (
            isFirstPlayer ? "Opponent's Turn" : "Your Turn"
          )}
        </div>

        <Button variant="outline" onClick={() => handleNewGame(false)}>
          New Game
        </Button>
      </div>

      {isResetting ? (
        <div className="flex items-center justify-center h-64 gap-2 text-slate-500 text-xl">
          <div className="w-6 h-6 border-4 border-dashed rounded-full animate-spin border-slate-400"></div>
          Resetting board...
        </div>
      ) : (
        <GameBoard
          board={board}
          currentPlayer={currentPlayer}
          onPocketClick={handlePocketClick}
          isAnimating={isAnimating}
          selectedPocket={selectedPocketIndex}
          disabled={
            !boardReady ||
            (gameMode === "multiplayer" && !hasGameStarted && !isFirstPlayer)
          }
        />
      )}

      <div className="h-12 mt-4 flex items-center justify-center">
        <AnimatePresence>
          {moveDescription && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
              <span className="text-slate-600 italic">{moveDescription}</span>
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
