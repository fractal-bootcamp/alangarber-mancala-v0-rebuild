import { Header } from "@/components/header"
import { GameMode } from "@/components/game-mode"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-50 to-slate-100">
        <h1 className="text-4xl font-bold mb-2 text-slate-800">Mancala</h1>
        <p className="text-slate-600 mb-8">Select a game mode to start playing</p>

        <GameMode isHomePage={true} />

        <div className="mt-12 text-center">
          <p className="text-slate-600 mb-4">New to Mancala?</p>
          <Button asChild variant="outline">
            <Link href="/rules">Learn the Rules</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
