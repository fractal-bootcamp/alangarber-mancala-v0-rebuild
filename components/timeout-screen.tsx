// TimeoutScreen.tsx
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TimeoutScreenProps {
  onRetry: () => void
  onCancel: () => void
}

export function TimeoutScreen({ onRetry, onCancel }: TimeoutScreenProps) {
  return (
    <div className="flex flex-col items-center w-full max-w-3xl">
      <h1 className="text-4xl font-bold mb-2 text-slate-800">Mancala</h1>

      <div className="bg-amber-50 rounded-xl p-8 shadow-lg w-full text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <AlertCircle className="h-12 w-12 text-amber-500" />
          <h2 className="text-xl font-semibold text-slate-800">No opponent available</h2>
          <p className="text-slate-600">Sorry, we couldn&apos;t find an opponent for you at this time.</p>

          <div className="flex space-x-4 mt-6">
            <Button onClick={onRetry} variant="default">
              Try Again
            </Button>
            <Button onClick={onCancel} variant="outline">
              Return Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
