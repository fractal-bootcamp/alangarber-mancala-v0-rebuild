"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"

export default function RulesPage() {
  const router = useRouter()

  const handlePlayNow = () => {
    // Set game mode to computer
    localStorage.setItem("mancalaGameMode", "computer")
    // Navigate to game page
    router.push("/game")
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container max-w-4xl py-8">
        <h1 className="text-3xl font-bold mb-6">Rules of Mancala</h1>

        <div className="space-y-6 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold mb-2">Game Setup</h2>
            <p>
              The Mancala board has 14 pits: 12 small pits (6 on each side) and 2 large pits (stores) at the ends. At
              the start of the game, 4 stones are placed in each of the 12 small pits. The stores are empty.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Objective</h2>
            <p>The goal is to collect more stones in your store than your opponent by the end of the game.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Gameplay</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Taking a turn:</strong> On your turn, select one of the pits on your side of the board. Take all
                stones from that pit and distribute them counterclockwise, one stone per pit, including your store but
                skipping your opponent&apos;s store.
              </li>
              <li>
                <strong>Extra turn:</strong> If the last stone you drop lands in your store, you get another turn.
              </li>
              <li>
                <strong>Capturing stones:</strong> If the last stone you drop lands in an empty pit on your side, you
                capture that stone and all stones in the pit directly opposite on your opponent&apos;s side. All captured
                stones go into your store.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Game End</h2>
            <p>
              The game ends when all six pits on one side of the board are empty. When this happens, the player with
              stones remaining on their side captures those stones and adds them to their store. The player with the
              most stones in their store wins.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Special Rules</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Skipping opponent&apos;s store:</strong> When distributing stones, you always skip your opponent&apos;s
                store.
              </li>
              <li>
                <strong>Ties:</strong> If both players have the same number of stones in their stores at the end of the
                game, it&apos;s a tie.
              </li>
            </ul>
          </section>
        </div>

        <div className="mt-8">
          <Button onClick={handlePlayNow}>Play Now</Button>
        </div>
      </main>
    </div>
  )
}
