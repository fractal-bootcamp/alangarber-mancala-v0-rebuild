"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface OpponentDisconnectedModalProps {
  message: string
  onClose: () => void
}

export function OpponentDisconnectedModal({ message, onClose }: OpponentDisconnectedModalProps) {
  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-2xl">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            Opponent Disconnected
          </DialogTitle>
          <DialogDescription className="text-center text-lg font-medium">{message}</DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-4">
          <div className="bg-amber-100 text-amber-800 px-6 py-3 rounded-lg text-center">
            <p className="font-bold text-lg">You Win!</p>
            <p className="text-sm">Your opponent has left the game.</p>
          </div>
        </div>

        <div className="flex justify-center">
          <Button onClick={onClose} className="w-32">
            Return Home
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
