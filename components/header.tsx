"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Home, PlayCircle, BookOpen } from "lucide-react"

export function Header() {
  const pathname = usePathname()

  return (
    <header className="w-full border-b bg-background">
      <div className="container flex h-16 items-center px-4 sm:px-6">
        <div className="flex items-center space-x-2 mr-4">
          <span className="text-xl font-bold">Mancala</span>
        </div>
        <nav className="flex items-center space-x-4 lg:space-x-6 mx-6">
          <Button asChild variant={pathname === "/" ? "default" : "ghost"} size="sm" className="text-sm font-medium">
            <Link href="/" className="flex items-center space-x-1">
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
          </Button>
          <Button
            asChild
            variant={pathname === "/game" ? "default" : "ghost"}
            size="sm"
            className="text-sm font-medium"
          >
            <Link href="/game" className="flex items-center space-x-1">
              <PlayCircle className="h-4 w-4" />
              <span>Current Game</span>
            </Link>
          </Button>
          <Button
            asChild
            variant={pathname === "/rules" ? "default" : "ghost"}
            size="sm"
            className="text-sm font-medium"
          >
            <Link href="/rules" className="flex items-center space-x-1">
              <BookOpen className="h-4 w-4" />
              <span>Rules</span>
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
