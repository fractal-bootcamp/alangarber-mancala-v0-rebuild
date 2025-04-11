"use client"

import { useState, useEffect, useCallback } from "react"
import { createGame, checkGameOver, determineWinner } from "@/lib/game-logic"

// Define a type for the persisted game state
interface PersistedGameState {
  board: number[]
  currentPlayer: "player1" | "player2"
  gameMode: "single" | "computer" | null
  lastUpdated: number
}

export function useGameState() {
  const [board, setBoard] = useState<number[]>(Array(14).fill(0))
  const [currentPlayer, setCurrentPlayer] = useState<"player1" | "player2">("player1")
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<"player1" | "player2" | "tie" | null>(null)
  const [gameMode, setGameMode] = useState<"single" | "computer" | null>(null)
  const [initialized, setInitialized] = useState(false)

  // Load game state from localStorage on initial mount
  useEffect(() => {
    if (initialized) return

    const savedState = localStorage.getItem("mancalaGameState")
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState) as PersistedGameState

        // Only restore if the saved state is less than 24 hours old
        const isRecent = Date.now() - parsedState.lastUpdated < 24 * 60 * 60 * 1000

        if (isRecent) {
          setBoard(parsedState.board)
          setCurrentPlayer(parsedState.currentPlayer)
          setGameMode(parsedState.gameMode)

          // Check if the loaded game is already over
          if (checkGameOver(parsedState.board)) {
            setGameOver(true)
            setWinner(determineWinner(parsedState.board))
          }
        } else {
          // Clear outdated state
          localStorage.removeItem("mancalaGameState")
        }
      } catch (error) {
        console.error("Error loading saved game state:", error)
        localStorage.removeItem("mancalaGameState")
      }
    }

    setInitialized(true)
  }, [initialized])

  // Save game state to localStorage whenever it changes
  const saveGameState = useCallback(() => {
    // Only save if we have a valid game mode (single or computer)
    if (gameMode && !gameOver && initialized) {
      const stateToSave: PersistedGameState = {
        board,
        currentPlayer,
        gameMode,
        lastUpdated: Date.now(),
      }
      localStorage.setItem("mancalaGameState", JSON.stringify(stateToSave))
    }
  }, [board, currentPlayer, gameMode, gameOver, initialized])

  // Save game state when relevant state changes
  useEffect(() => {
    saveGameState()
  }, [board, currentPlayer, gameMode, gameOver, saveGameState])

  const initializeGame = useCallback((mode: "single" | "computer" | null = null) => {
    const initialBoard = createGame()
    setBoard(initialBoard)
    setCurrentPlayer("player1")
    setGameOver(false)
    setWinner(null)

    if (mode) {
      setGameMode(mode)
    }
  }, [])

  const updateGameState = useCallback(
    (newBoard: number[]) => {
      setBoard(newBoard)

      // Check if the game is over
      if (checkGameOver(newBoard)) {
        setGameOver(true)
        setWinner(determineWinner(newBoard))

        // Clear saved game state when game is over
        if (gameMode) {
          localStorage.removeItem("mancalaGameState")
        }
      }
    },
    [gameMode],
  )

  const resetGame = useCallback(() => {
    initializeGame(gameMode)
  }, [initializeGame, gameMode])

  const clearSavedGame = useCallback(() => {
    localStorage.removeItem("mancalaGameState")
  }, [])

  return {
    board,
    currentPlayer,
    gameOver,
    winner,
    gameMode,
    initializeGame,
    updateGameState,
    resetGame,
    setCurrentPlayer,
    setBoard,
    setGameMode,
    clearSavedGame,
    setGameOver,
    setWinner,
  }
}
