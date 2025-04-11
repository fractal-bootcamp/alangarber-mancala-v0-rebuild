"use client"

import { DialogFooter } from "@/components/ui/dialog"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trophy } from "lucide-react"

interface GameOverModalProps {
  result: {
    winner: "player1" | "player2" | "tie" | null
    message: string
  }
  onNewGame: () => void
  onRestart: () => void
  onClose: () => void
}

export function GameOverModal({ result, onNewGame, onRestart, onClose }: GameOverModalProps) {
  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-2xl">
            {result.winner !== "tie" && <Trophy className="h-6 w-6 text-amber-500" />}
            Game Over
          </DialogTitle>
          <DialogDescription className="text-center text-lg font-medium">{result.message}</DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-4">
          {result.winner === "player1" && (
            <div className="bg-amber-100 text-amber-800 px-6 py-3 rounded-lg text-center">
              <p className="font-bold text-lg">Player 1 Wins!</p>
              <p className="text-sm">Congratulations on your victory!</p>
            </div>
          )}

          {result.winner === "player2" && (
            <div className="bg-amber-100 text-amber-800 px-6 py-3 rounded-lg text-center">
              <p className="font-bold text-lg">Player 2 Wins!</p>
              <p className="text-sm">Better luck next time, Player 1!</p>
            </div>
          )}

          {result.winner === "tie" && (
            <div className="bg-slate-100 text-slate-800 px-6 py-3 rounded-lg text-center">
              <p className="font-bold text-lg">It&apos;s a Tie!</p>
              <p className="text-sm">Great game by both players!</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-center gap-4">
          <Button variant="outline" onClick={onRestart} className="w-32">
            New Settings
          </Button>
          <Button onClick={onNewGame} className="w-32">
            Play Again
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
