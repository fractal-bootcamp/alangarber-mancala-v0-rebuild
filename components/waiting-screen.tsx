// WaitingScreen.tsx
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WaitingScreenProps {
  waitingTime: number
  onCancel: () => void
}

export function WaitingScreen({ waitingTime, onCancel }: WaitingScreenProps) {
  return (
    <div className="flex flex-col items-center w-full max-w-3xl">
      <h1 className="text-4xl font-bold mb-2 text-slate-800">Mancala</h1>

      <div className="bg-amber-50 rounded-xl p-8 shadow-lg w-full text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 text-amber-500 animate-spin" />
          <h2 className="text-xl font-semibold text-slate-800">Waiting for an opponent...</h2>
          <p className="text-slate-600">This could take a moment. We&apos;ll connect you as soon as another player joins.</p>

          <div className="mt-4 text-amber-600 font-medium">Timeout in: {waitingTime} seconds</div>

          <Button onClick={onCancel} variant="outline" className="mt-6">
            Cancel and Return Home
          </Button>
        </div>
      </div>
    </div>
  )
}
