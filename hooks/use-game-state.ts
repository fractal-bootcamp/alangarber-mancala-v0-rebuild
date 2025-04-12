"use client"

import { useState, useEffect, useCallback } from "react"
import { createGame, checkGameOver, determineWinner } from "@/lib/game-logic"

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

    const key = `mancalaGameState-${gameMode || "default"}`
    const savedState = localStorage.getItem(key)
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState) as PersistedGameState
        const isRecent = Date.now() - parsedState.lastUpdated < 24 * 60 * 60 * 1000

        if (isRecent) {
          setBoard(parsedState.board)
          setCurrentPlayer(parsedState.currentPlayer)
          setGameMode(parsedState.gameMode)

          if (checkGameOver(parsedState.board)) {
            setGameOver(true)
            setWinner(determineWinner(parsedState.board))
          }
        } else {
          localStorage.removeItem(key)
        }
      } catch (error) {
        console.error("Error loading saved game state:", error)
        localStorage.removeItem(key)
      }
    }

    setInitialized(true)
  }, [initialized, gameMode])

  const saveGameState = useCallback(() => {
    if (gameMode && !gameOver && initialized) {
      const key = `mancalaGameState-${gameMode}`
      const stateToSave: PersistedGameState = {
        board,
        currentPlayer,
        gameMode,
        lastUpdated: Date.now(),
      }
      localStorage.setItem(key, JSON.stringify(stateToSave))
    }
  }, [board, currentPlayer, gameMode, gameOver, initialized])

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

  const updateGameState = useCallback((newBoard: number[]) => {
    setBoard(newBoard)
    if (checkGameOver(newBoard)) {
      setGameOver(true)
      setWinner(determineWinner(newBoard))

      if (gameMode) {
        const key = `mancalaGameState-${gameMode}`
        localStorage.removeItem(key)
      }
    }
  }, [gameMode])

  const resetGame = useCallback(() => {
    initializeGame(gameMode)
  }, [initializeGame, gameMode])

  const clearSavedGame = useCallback(() => {
    if (gameMode) {
      const key = `mancalaGameState-${gameMode}`
      localStorage.removeItem(key)
    }
  }, [gameMode])

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
