"use client"

import { useState, useEffect, useCallback } from "react"
import { io, type Socket } from "socket.io-client"
import { useToast } from "@/hooks/use-toast"

// Define socket event types
interface ServerToClientEvents {
  gameState: (data: {
    gameId: string
    board: number[]
    currentPlayer: "player1" | "player2"
    lastMove?: {
      player: "player1" | "player2"
      pocket: number
      description: string
    }
  }) => void
  playerJoined: (data: { gameId: string; player: "player1" | "player2" }) => void
  gameOver: (data: { winner: "player1" | "player2" | "tie"; message: string }) => void
  error: (message: string) => void
  matched: (data: { gameId: string; player: "player1" | "player2" }) => void
  opponentDisconnected: (data: { gameId: string; message: string }) => void
}

interface ClientToServerEvents {
  joinGame: () => void
  makeMove: (data: { gameId: string; pocket: number; player: "player1" | "player2" }) => void
  leaveGame: (gameId?: string) => void
}

// Singleton socket instance
let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null

export function useSocket() {
  const { toast } = useToast()
  const [isConnected, setIsConnected] = useState(false)
  const [gameId, setGameId] = useState<string | null>(null)
  const [player, setPlayer] = useState<"player1" | "player2" | null>(null)
  const [board, setBoard] = useState<number[] | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<"player1" | "player2">("player1")
  const [lastMove, setLastMove] = useState<{
    player: "player1" | "player2"
    pocket: number
    description: string
  } | null>(null)
  const [status, setStatus] = useState<"idle" | "waiting" | "matched" | "error" | "timeout">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [opponentDisconnected, setOpponentDisconnected] = useState<{
    gameId: string
    message: string
  } | null>(null)
  const [waitingStartTime, setWaitingStartTime] = useState<number | null>(null)

  // Initialize socket connection
  useEffect(() => {
    if (!socket) {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL
      if (!socketUrl) {
        console.error("NEXT_PUBLIC_SOCKET_URL is not defined")
        setStatus("error")
        setErrorMessage("Socket URL is not defined")
        return
      }

      try {
        console.log("Connecting to WebSocket server:", socketUrl)
        socket = io(socketUrl, {
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          autoConnect: true,
          transports: ["websocket"],
          timeout: 10000,
        })
      } catch (error) {
        console.error("Failed to initialize socket:", error)
        setStatus("error")
        setErrorMessage("Failed to connect to game server")
        return
      }
    }

    // Set up event listeners
    const onConnect = () => {
      console.log("Socket connected successfully:", socket?.id)
      setIsConnected(true)
      setErrorMessage(null)
    }

    const onDisconnect = () => {
      console.log("Socket disconnected")
      setIsConnected(false)
    }

    const onConnectError = (err: Error) => {
      console.error("Socket connection error:", err.message)
      setIsConnected(false)
      setErrorMessage(err.message)
      toast({
        title: "Connection issue",
        description: "Could not connect to game server. Some features may be limited.",
        variant: "destructive",
      })
    }

    const onGameState = (data: {
      gameId: string
      board: number[]
      currentPlayer: "player1" | "player2"
      lastMove?: {
        player: "player1" | "player2"
        pocket: number
        description: string
      }
    }) => {
      console.log("Received game state update:", data)
      setBoard(data.board)
      setCurrentPlayer(data.currentPlayer)
      if (data.lastMove) {
        setLastMove(data.lastMove)
      }
    }

    const onMatched = (data: { gameId: string; player: "player1" | "player2" }) => {
      console.log("Matched with opponent:", data)
      setStatus("matched")
      setGameId(data.gameId)
      setPlayer(data.player)
      setWaitingStartTime(null)

      toast({
        title: "Opponent found!",
        description: `You are ${data.player === "player1" ? "Player 1" : "Player 2"}`,
      })
    }

    const onError = (message: string) => {
      console.error("Received error from server:", message)
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
      setErrorMessage(message)
    }

    const onGameOver = (data: { winner: "player1" | "player2" | "tie"; message: string }) => {
      console.log("Game over:", data)
      toast({
        title: "Game Over",
        description: data.message,
      })
    }

    const onOpponentDisconnected = (data: { gameId: string; message: string }) => {
      console.log("Opponent disconnected:", data)
      setOpponentDisconnected({
        gameId: data.gameId,
        message: data.message,
      })
      toast({
        title: "Opponent Disconnected",
        description: data.message,
      })
      setStatus("idle")
      setGameId(null)
      setPlayer(null)
    }

    // Register event handlers
    socket.on("connect", onConnect)
    socket.on("disconnect", onDisconnect)
    socket.on("connect_error", onConnectError)
    socket.on("gameState", onGameState)
    socket.on("matched", onMatched)
    socket.on("error", onError)
    socket.on("gameOver", onGameOver)
    socket.on("opponentDisconnected", onOpponentDisconnected)

    // If already connected, set state
    if (socket.connected) {
      setIsConnected(true)
    }

    // Check for timeout
    if (status === "waiting" && waitingStartTime) {
      const timeoutId = setTimeout(() => {
        if (Date.now() - waitingStartTime > 30000) {
          // 30 seconds timeout
          setStatus("timeout")
        }
      }, 30000)

      return () => clearTimeout(timeoutId)
    }

    // Clean up event listeners on unmount
    return () => {
      if (socket) {
        socket.off("connect", onConnect)
        socket.off("disconnect", onDisconnect)
        socket.off("connect_error", onConnectError)
        socket.off("gameState", onGameState)
        socket.off("matched", onMatched)
        socket.off("error", onError)
        socket.off("gameOver", onGameOver)
        socket.off("opponentDisconnected", onOpponentDisconnected)
      }
    }
  }, [toast, status, waitingStartTime])

  // Join a game
  const joinGame = useCallback(() => {
    if (!socket) {
      setErrorMessage("Socket not initialized")
      return
    }

    setStatus("waiting")
    setWaitingStartTime(Date.now())
    console.log("Emitting joinGame event")
    socket.emit("joinGame")
  }, [])

  // Make a move
  const makeMove = useCallback(
    (pocket: number) => {
      if (!socket || !gameId || !player) {
        return false
      }

      console.log("Emitting makeMove event:", {
        gameId,
        pocket,
        player,
      })

      socket.emit("makeMove", {
        gameId,
        pocket,
        player,
      })

      return true
    },
    [gameId, player],
  )

  // Leave the game
  const leaveGame = useCallback(() => {
    if (!socket) return

    console.log("Emitting leaveGame event:", gameId)
    if (gameId) {
      socket.emit("leaveGame", gameId)
    } else {
      socket.emit("leaveGame")
    }

    setStatus("idle")
    setGameId(null)
    setPlayer(null)
    setWaitingStartTime(null)
  }, [gameId])

  return {
    isConnected,
    status,
    gameId,
    player,
    isFirstPlayer: player === "player1",
    errorMessage,
    waitingStartTime,
    board,
    currentPlayer,
    lastMove,
    opponentDisconnected,
    joinGame,
    makeMove,
    leaveGame,
  }
}
