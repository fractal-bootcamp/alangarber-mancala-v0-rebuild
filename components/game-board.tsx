"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface GameBoardProps {
  board: number[]
  currentPlayer: "player1" | "player2"
  onPocketClick: (index: number) => void
  isAnimating: boolean
  selectedPocket: number | null
}

export function GameBoard({ board, currentPlayer, onPocketClick, isAnimating, selectedPocket }: GameBoardProps) {
  // Keep a copy of the previous board state for animations
  const [prevBoard, setPrevBoard] = useState<number[]>(board)
  const [animatingStones, setAnimatingStones] = useState<{ from: number; to: number }[]>([])
  const [showChangeIndicators, setShowChangeIndicators] = useState(false)

  // Update the previous board state when animation starts
  useEffect(() => {
    if (isAnimating && selectedPocket !== null) {
      // Create animation sequence
      const stones = prevBoard[selectedPocket]
      const newAnimatingStones = []

      // Determine which pockets will receive stones
      let currentIndex = selectedPocket
      let remainingStones = stones

      while (remainingStones > 0) {
        currentIndex = (currentIndex + 1) % 14

        // Skip opponent's store
        if (
          (currentPlayer === "player1" && currentIndex === 13) ||
          (currentPlayer === "player2" && currentIndex === 6)
        ) {
          continue
        }

        newAnimatingStones.push({
          from: selectedPocket,
          to: currentIndex,
        })
        remainingStones--
      }

      setAnimatingStones(newAnimatingStones)

      // Show change indicators after a short delay
      setTimeout(() => {
        setShowChangeIndicators(true)
      }, 300)
    }
  }, [isAnimating, selectedPocket, currentPlayer, prevBoard])

  // Reset animation state when animation completes
  useEffect(() => {
    if (!isAnimating) {
      setPrevBoard([...board])
      setAnimatingStones([])
      setShowChangeIndicators(false)
    }
  }, [isAnimating, board])

  // Calculate the change in stones for each pocket
  const getStoneChange = (index: number) => {
    if (!isAnimating || selectedPocket === null) return 0

    if (index === selectedPocket) {
      return -prevBoard[selectedPocket]
    }

    // Count how many stones will land in this pocket
    return animatingStones.filter((stone) => stone.to === index).length
  }

  // Determine if a pocket is clickable
  const isPocketClickable = (index: number) => {
    if (isAnimating) return false

    if (currentPlayer === "player1") {
      return index >= 0 && index < 6 && board[index] > 0
    } else {
      return index >= 7 && index < 13 && board[index] > 0
    }
  }

  return (
    <div className="w-full bg-amber-50 rounded-xl p-6 shadow-lg">
      <div className="flex justify-between items-center mb-8">
        <div className="text-sm font-medium text-slate-500">Player 2</div>
        <div className="text-sm font-medium text-slate-500">Player 1</div>
      </div>

      <div className="flex justify-between">
        {/* Player 2's store */}
        <div
          className={`w-24 h-64 rounded-2xl flex items-center justify-center bg-amber-200 border-2 relative overflow-hidden ${
            currentPlayer === "player2" ? "border-amber-500" : "border-amber-200"
          }`}
        >
          <div className="text-center">
            <div className="text-xl font-bold">{board[13]}</div>
            <div className="text-xs mt-1">Player 2&apos;s Store</div>
          </div>

          {/* Change indicator for Player 2's store */}
          <AnimatePresence>
            {showChangeIndicators && getStoneChange(13) > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute top-4 right-4 bg-green-100 text-green-800 rounded-full px-2 py-1 text-sm font-bold"
              >
                +{getStoneChange(13)}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Animated stones going to Player 2's store */}
          <AnimatePresence>
            {animatingStones
              .filter((stone) => stone.to === 13)
              .map((_, i) => (
                <motion.div
                  key={`p2store-${i}`}
                  initial={{
                    x: selectedPocket !== null && selectedPocket >= 7 ? (selectedPocket - 13) * 60 : 200,
                    y: 0,
                    opacity: 0,
                  }}
                  animate={{ x: 0, y: i * 5 - 20, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 0.8, // Slower animation
                    delay: i * 0.2 + 0.3, // More delay between stones
                    type: "spring",
                    stiffness: 100, // Less stiff for smoother motion
                    damping: 10,
                  }}
                  className="absolute w-5 h-5 rounded-full bg-amber-500 shadow-md z-10"
                  style={{
                    backgroundColor: [
                      "#f59e0b", // amber-500
                      "#84cc16", // lime-500
                      "#06b6d4", // cyan-500
                      "#8b5cf6", // violet-500
                      "#ec4899", // pink-500
                    ][i % 5],
                  }}
                />
              ))}
          </AnimatePresence>
        </div>

        <div className="flex-1 mx-4">
          <div className="grid grid-cols-6 gap-4 mb-4">
            {/* Player 2's pockets (reversed for display) */}
            {[12, 11, 10, 9, 8, 7].map((index) => (
              <button
                key={`p2-${index}`}
                onClick={() => isPocketClickable(index) && onPocketClick(index)}
                disabled={!isPocketClickable(index)}
                className={`h-24 rounded-full flex items-center justify-center bg-amber-100 relative overflow-hidden ${
                  isPocketClickable(index) ? "hover:bg-amber-200 cursor-pointer" : "cursor-not-allowed"
                } ${
                  currentPlayer === "player2" && board[index] > 0
                    ? "border-2 border-amber-500"
                    : "border-2 border-amber-100"
                }`}
              >
                <StonesDisplay count={board[index]} />

                {/* Change indicator */}
                <AnimatePresence>
                  {showChangeIndicators && getStoneChange(index) !== 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className={`absolute top-2 right-2 ${
                        getStoneChange(index) > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      } rounded-full px-2 py-1 text-sm font-bold z-20`}
                    >
                      {getStoneChange(index) > 0 ? "+" : ""}
                      {getStoneChange(index)}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Animated stones going to this pocket */}
                <AnimatePresence>
                  {animatingStones
                    .filter((stone) => stone.to === index)
                    .map((_, i) => (
                      <motion.div
                        key={`to-p2-${index}-${i}`}
                        initial={{
                          x: selectedPocket !== null ? (selectedPocket - index) * 60 : 0,
                          y: selectedPocket !== null && selectedPocket < 6 ? 100 : 0,
                          opacity: 0,
                        }}
                        animate={{ x: 0, y: 0, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                          duration: 0.8, // Slower animation
                          delay: i * 0.2 + 0.3, // More delay between stones
                          type: "spring",
                          stiffness: 100,
                          damping: 10,
                        }}
                        className="absolute w-5 h-5 rounded-full shadow-md z-10"
                        style={{
                          backgroundColor: [
                            "#f59e0b", // amber-500
                            "#84cc16", // lime-500
                            "#06b6d4", // cyan-500
                            "#8b5cf6", // violet-500
                            "#ec4899", // pink-500
                          ][i % 5],
                        }}
                      />
                    ))}
                </AnimatePresence>

                {/* Animated stones leaving this pocket */}
                {selectedPocket === index && isAnimating && (
                  <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0.7 }}
                    className="absolute inset-0 bg-amber-200 flex items-center justify-center z-0"
                    transition={{ duration: 1.5 }}
                  >
                    <span className="text-amber-800 font-medium">Moving...</span>
                  </motion.div>
                )}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-6 gap-4">
            {/* Player 1's pockets */}
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <button
                key={`p1-${index}`}
                onClick={() => isPocketClickable(index) && onPocketClick(index)}
                disabled={!isPocketClickable(index)}
                className={`h-24 rounded-full flex items-center justify-center bg-amber-100 relative overflow-hidden ${
                  isPocketClickable(index) ? "hover:bg-amber-200 cursor-pointer" : "cursor-not-allowed"
                } ${
                  currentPlayer === "player1" && board[index] > 0
                    ? "border-2 border-amber-500"
                    : "border-2 border-amber-100"
                }`}
              >
                <StonesDisplay count={board[index]} />

                {/* Change indicator */}
                <AnimatePresence>
                  {showChangeIndicators && getStoneChange(index) !== 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className={`absolute top-2 right-2 ${
                        getStoneChange(index) > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      } rounded-full px-2 py-1 text-sm font-bold z-20`}
                    >
                      {getStoneChange(index) > 0 ? "+" : ""}
                      {getStoneChange(index)}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Animated stones going to this pocket */}
                <AnimatePresence>
                  {animatingStones
                    .filter((stone) => stone.to === index)
                    .map((_, i) => (
                      <motion.div
                        key={`to-p1-${index}-${i}`}
                        initial={{
                          x: selectedPocket !== null ? (selectedPocket - index) * 60 : 0,
                          y: selectedPocket !== null && selectedPocket >= 7 ? -100 : 0,
                          opacity: 0,
                        }}
                        animate={{ x: 0, y: 0, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                          duration: 0.8, // Slower animation
                          delay: i * 0.2 + 0.3, // More delay between stones
                          type: "spring",
                          stiffness: 100,
                          damping: 10,
                        }}
                        className="absolute w-5 h-5 rounded-full shadow-md z-10"
                        style={{
                          backgroundColor: [
                            "#f59e0b", // amber-500
                            "#84cc16", // lime-500
                            "#06b6d4", // cyan-500
                            "#8b5cf6", // violet-500
                            "#ec4899", // pink-500
                          ][i % 5],
                        }}
                      />
                    ))}
                </AnimatePresence>

                {/* Animated stones leaving this pocket */}
                {selectedPocket === index && isAnimating && (
                  <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0.7 }}
                    className="absolute inset-0 bg-amber-200 flex items-center justify-center z-0"
                    transition={{ duration: 1.5 }}
                  >
                    <span className="text-amber-800 font-medium">Moving...</span>
                  </motion.div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Player 1's store */}
        <div
          className={`w-24 h-64 rounded-2xl flex items-center justify-center bg-amber-200 border-2 relative overflow-hidden ${
            currentPlayer === "player1" ? "border-amber-500" : "border-amber-200"
          }`}
        >
          <div className="text-center">
            <div className="text-xl font-bold">{board[6]}</div>
            <div className="text-xs mt-1">Player 1&apos;s Store</div>
          </div>

          {/* Change indicator for Player 1's store */}
          <AnimatePresence>
            {showChangeIndicators && getStoneChange(6) > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute top-4 right-4 bg-green-100 text-green-800 rounded-full px-2 py-1 text-sm font-bold"
              >
                +{getStoneChange(6)}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Animated stones going to Player 1's store */}
          <AnimatePresence>
            {animatingStones
              .filter((stone) => stone.to === 6)
              .map((_, i) => (
                <motion.div
                  key={`p1store-${i}`}
                  initial={{
                    x: selectedPocket !== null && selectedPocket < 6 ? (selectedPocket - 6) * 60 : -200,
                    y: 0,
                    opacity: 0,
                  }}
                  animate={{ x: 0, y: i * 5 - 20, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 0.8, // Slower animation
                    delay: i * 0.2 + 0.3, // More delay between stones
                    type: "spring",
                    stiffness: 100,
                    damping: 10,
                  }}
                  className="absolute w-5 h-5 rounded-full bg-amber-500 shadow-md z-10"
                  style={{
                    backgroundColor: [
                      "#f59e0b", // amber-500
                      "#84cc16", // lime-500
                      "#06b6d4", // cyan-500
                      "#8b5cf6", // violet-500
                      "#ec4899", // pink-500
                    ][i % 5],
                  }}
                />
              ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function StonesDisplay({ count }: { count: number }) {
  if (count === 0) {
    return <span className="text-slate-400">Empty</span>
  }

  if (count > 10) {
    return <span className="text-xl font-bold">{count}</span>
  }

  // Display stones visually for counts 1-10
  return (
    <div className="flex flex-wrap justify-center items-center w-full h-full p-2">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-3 h-3 m-0.5 rounded-full"
          style={{
            backgroundColor: [
              "#f59e0b", // amber-500
              "#84cc16", // lime-500
              "#06b6d4", // cyan-500
              "#8b5cf6", // violet-500
              "#ec4899", // pink-500
            ][i % 5],
          }}
        />
      ))}
    </div>
  )
}
