"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { MancalaGame } from "@/components/mancala-game"

export default function GamePage() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [gameMode, setGameMode] = useState<"single" | "computer" | "multiplayer">("computer")

  // Initialize game mode from localStorage or set default
  useEffect(() => {
    const storedGameMode = localStorage.getItem("mancalaGameMode") as "single" | "computer" | "multiplayer" | null

    if (storedGameMode) {
      setGameMode(storedGameMode)
    } else {
      // Set default game mode to computer if none exists
      localStorage.setItem("mancalaGameMode", "computer")
    }

    setIsInitialized(true)
  }, [])

  if (!isInitialized) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse">Loading game...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-50 to-slate-100">
        <MancalaGame forceGameMode={gameMode} />
      </main>
    </div>
  )
}
