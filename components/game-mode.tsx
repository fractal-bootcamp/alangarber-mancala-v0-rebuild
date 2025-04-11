"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { UserIcon, MonitorIcon, UsersIcon } from "lucide-react"

interface GameModeProps {
  onSelectMode?: (mode: "single" | "computer" | "multiplayer") => void
  isHomePage?: boolean
}

export function GameMode({ onSelectMode, isHomePage = false }: GameModeProps) {
  const router = useRouter()

  const handleSelectMode = (mode: "single" | "computer" | "multiplayer") => {
    // Store the selected mode in localStorage
    localStorage.setItem("mancalaGameMode", mode)

    if (isHomePage) {
      // If on home page, navigate to game page
      router.push("/game")
    } else if (onSelectMode) {
      // If in the game component, call the callback
      onSelectMode(mode)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Play Solo
          </CardTitle>
          <CardDescription>Play against yourself on the same device</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-sm text-slate-500">
            Take turns playing as both players. Perfect for learning the game or practicing strategies.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => handleSelectMode("single")} className="w-full">
            Start Game
          </Button>
        </CardFooter>
      </Card>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MonitorIcon className="h-5 w-5" />
            Play vs Computer
          </CardTitle>
          <CardDescription>Challenge our AI opponent</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-sm text-slate-500">
            Play against a computer opponent that will calculate the best possible move. A real challenge!
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => handleSelectMode("computer")} className="w-full">
            Start Game
          </Button>
        </CardFooter>
      </Card>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            Play Online
          </CardTitle>
          <CardDescription>Play against another person</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-sm text-slate-500">
            Challenge a friend or get matched with another player online. Connect in real-time with other players.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => handleSelectMode("multiplayer")} className="w-full">
            Find Opponent
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
