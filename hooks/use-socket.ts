"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { useToast } from "@/hooks/use-toast";

// Define socket event types
interface ServerToClientEvents {
  gameState: (data: {
    gameId: string;
    board: number[];
    currentPlayer: "player1" | "player2";
    yourPlayer?: "player1" | "player2";
    lastMove?: {
      player: "player1" | "player2";
      pocket: number;
      description: string;
    };
  }) => void;
  playerJoined: (data: { gameId: string; player: "player1" | "player2" }) => void;
  gameOver: (data: { winner: "player1" | "player2" | "tie"; message: string }) => void;
  error: (message: string) => void;
  matched: (data: { gameId: string; player: "player1" | "player2"; currentPlayer: "player1" | "player2" }) => void;
  opponentDisconnected: (data: { gameId: string; message: string }) => void;
}

interface ClientToServerEvents {
  joinGame: () => void;
  makeMove: (data: { gameId: string; pocket: number; player: "player1" | "player2" }) => void;
  leaveGame: (gameId?: string) => void;
}

// Singleton socket instance
let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function useSocket() {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [ready, setReady] = useState(false);

  const [status, setStatus] = useState<"idle" | "waiting" | "matched" | "error" | "timeout">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [board, setBoard] = useState<number[] | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<"player1" | "player2">("player1");
  const [lastMove, setLastMove] = useState<{
    player: "player1" | "player2";
    pocket: number;
    description: string;
  } | null>(null);
  const [opponentDisconnected, setOpponentDisconnected] = useState<{
    gameId: string;
    message: string;
  } | null>(null);

  const [waitingStartTime, setWaitingStartTime] = useState<number | null>(null);

  // Refs to store latest gameId and player
  const gameIdRef = useRef<string | null>(null);
  const playerRef = useRef<"player1" | "player2" | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!socket) {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
      if (!socketUrl) {
        console.error("NEXT_PUBLIC_SOCKET_URL is not defined");
        setStatus("error");
        setErrorMessage("Socket URL is not defined");
        return;
      }

      try {
        console.log("Connecting to WebSocket server:", socketUrl);
        socket = io(socketUrl, {
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          autoConnect: true,
          transports: ["websocket"],
          timeout: 10000,
        });
      } catch (error) {
        console.error("Failed to initialize socket:", error);
        setStatus("error");
        setErrorMessage("Failed to connect to game server");
        return;
      }
    }

    const onConnect = () => {
      console.log("Socket connected successfully:", socket?.id);
      setIsConnected(true);
      setReady(true);
      setErrorMessage(null);
    };

    const onDisconnect = () => {
      console.log("Socket disconnected");
      setIsConnected(false);
      setReady(false);
    };

    const onConnectError = (err: Error) => {
      console.error("Socket connection error:", err.message);
      setIsConnected(false);
      setReady(false);
      setErrorMessage(err.message);
      toast({
        title: "Connection issue",
        description: "Could not connect to game server. Some features may be limited.",
        variant: "destructive",
      });
    };

    const onGameState = (data: {
      gameId: string;
      board: number[];
      currentPlayer: "player1" | "player2";
      yourPlayer?: "player1" | "player2";
      lastMove?: {
        player: "player1" | "player2";
        pocket: number;
        description: string;
      };
    }) => {
      console.log("Received game state update:", data);
      setBoard(data.board);
      setCurrentPlayer(data.currentPlayer);
      if (data.lastMove) {
        setLastMove(data.lastMove);
      }
    };

    const onMatched = (data: { gameId: string; player: "player1" | "player2"; currentPlayer: "player1" | "player2" }) => {
      console.log("Matched with opponent:", data);
      setStatus("matched");
      gameIdRef.current = data.gameId;
      playerRef.current = data.player;
      setCurrentPlayer(data.currentPlayer);
      setWaitingStartTime(null);

      toast({
        title: "Opponent found!",
        description: `You are ${data.player === "player1" ? "Player 1" : "Player 2"}`,
      });

      if (data.player === data.currentPlayer) {
        toast({
          title: "Your Move!",
          description: "It's your turn to make the first move.",
        });
      } else {
        toast({
          title: "Waiting...",
          description: "Opponent's turn. Get ready!",
        });
      }
    };

    const onError = (message: string) => {
      console.error("Received error from server:", message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      setErrorMessage(message);
    };

    const onGameOver = (data: { winner: "player1" | "player2" | "tie"; message: string }) => {
      console.log("Game over:", data);
      toast({
        title: "Game Over",
        description: data.message,
      });
    };

    const onOpponentDisconnected = (data: { gameId: string; message: string }) => {
      console.log("Opponent disconnected:", data);
      setOpponentDisconnected({
        gameId: data.gameId,
        message: data.message,
      });
      toast({
        title: "Opponent Disconnected",
        description: data.message,
      });
      setStatus("idle");
      gameIdRef.current = null;
      playerRef.current = null;
    };

    // Register event handlers
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("gameState", onGameState);
    socket.on("matched", onMatched);
    socket.on("error", onError);
    socket.on("gameOver", onGameOver);
    socket.on("opponentDisconnected", onOpponentDisconnected);

    if (socket.connected) {
      setIsConnected(true);
      setReady(true);
    }

    return () => {
      if (socket) {
        socket.off("connect", onConnect);
        socket.off("disconnect", onDisconnect);
        socket.off("connect_error", onConnectError);
        socket.off("gameState", onGameState);
        socket.off("matched", onMatched);
        socket.off("error", onError);
        socket.off("gameOver", onGameOver);
        socket.off("opponentDisconnected", onOpponentDisconnected);
      }
    };
  }, [toast]);

  // Join a game
  const joinGame = useCallback(() => {
    if (!socket || !ready) {
      console.warn("Socket not ready yet, cannot join game");
      return;
    }

    console.log("Emitting joinGame event");
    socket.emit("joinGame");
    setStatus("waiting");
    setWaitingStartTime(Date.now());
  }, [ready]);

  // Make a move
  const makeMove = useCallback((pocket: number) => {
    if (!socket || !ready) {
      console.warn("Socket not ready yet, cannot make move");
      return false;
    }

    const gameId = gameIdRef.current;
    const player = playerRef.current;

    if (!gameId || !player) {
      console.warn("Cannot make move: missing gameId or player");
      return false;
    }

    console.log("Emitting makeMove event:", { gameId, pocket, player });
    socket.emit("makeMove", { gameId, pocket, player });
    return true;
  }, [ready]);

  // Leave the game
  const leaveGame = useCallback(() => {
    if (!socket || !ready) {
      console.warn("Socket not ready yet, cannot leave game");
      return;
    }

    const gameId = gameIdRef.current;
    console.log("Emitting leaveGame event:", gameId);
    socket.emit("leaveGame", gameId ?? undefined);

    setStatus("idle");
    gameIdRef.current = null;
    playerRef.current = null;
    setWaitingStartTime(null);
  }, [ready]);

  return {
    isConnected,
    status,
    gameId: gameIdRef.current,
    player: playerRef.current,
    isFirstPlayer: playerRef.current === "player1",
    errorMessage,
    waitingStartTime,
    board,
    currentPlayer,
    lastMove,
    opponentDisconnected,
    joinGame,
    makeMove,
    leaveGame,
  };
}