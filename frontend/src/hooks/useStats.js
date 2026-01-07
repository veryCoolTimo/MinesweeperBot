import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'minesweeper_stats'

const defaultStats = {
  classic: {
    easy: { played: 0, won: 0, bestTime: null, totalTime: 0 },
    medium: { played: 0, won: 0, bestTime: null, totalTime: 0 },
    hard: { played: 0, won: 0, bestTime: null, totalTime: 0 }
  },
  timed: {
    easy: { played: 0, bestScore: 0, totalWins: 0 },
    medium: { played: 0, bestScore: 0, totalWins: 0 },
    hard: { played: 0, bestScore: 0, totalWins: 0 }
  },
  noflags: {
    easy: { played: 0, won: 0, bestTime: null },
    medium: { played: 0, won: 0, bestTime: null },
    hard: { played: 0, won: 0, bestTime: null }
  },
  currentStreak: 0,
  bestStreak: 0,
  tutorialCompleted: false
}

function loadStats() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // Merge with defaults in case new fields are added
      return { ...defaultStats, ...parsed }
    }
  } catch (e) {
    console.error('Failed to load stats:', e)
  }
  return defaultStats
}

function saveStats(stats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  } catch (e) {
    console.error('Failed to save stats:', e)
  }
}

export function useStats() {
  const [stats, setStats] = useState(loadStats)

  // Save whenever stats change
  useEffect(() => {
    saveStats(stats)
  }, [stats])

  const recordWin = useCallback((mode, difficulty, timeSeconds) => {
    setStats(prev => {
      const newStats = { ...prev }

      if (mode === 'classic') {
        const diffStats = { ...prev.classic[difficulty] }
        diffStats.played++
        diffStats.won++
        diffStats.totalTime += timeSeconds
        if (diffStats.bestTime === null || timeSeconds < diffStats.bestTime) {
          diffStats.bestTime = timeSeconds
        }
        newStats.classic = { ...prev.classic, [difficulty]: diffStats }
      } else if (mode === 'noflags') {
        const diffStats = { ...prev.noflags[difficulty] }
        diffStats.played++
        diffStats.won++
        if (diffStats.bestTime === null || timeSeconds < diffStats.bestTime) {
          diffStats.bestTime = timeSeconds
        }
        newStats.noflags = { ...prev.noflags, [difficulty]: diffStats }
      }

      // Update streak
      newStats.currentStreak = prev.currentStreak + 1
      if (newStats.currentStreak > prev.bestStreak) {
        newStats.bestStreak = newStats.currentStreak
      }

      return newStats
    })
  }, [])

  const recordLoss = useCallback((mode, difficulty) => {
    setStats(prev => {
      const newStats = { ...prev }

      if (mode === 'classic') {
        const diffStats = { ...prev.classic[difficulty] }
        diffStats.played++
        newStats.classic = { ...prev.classic, [difficulty]: diffStats }
      } else if (mode === 'noflags') {
        const diffStats = { ...prev.noflags[difficulty] }
        diffStats.played++
        newStats.noflags = { ...prev.noflags, [difficulty]: diffStats }
      }

      // Reset streak
      newStats.currentStreak = 0

      return newStats
    })
  }, [])

  const recordTimedSession = useCallback((difficulty, wins) => {
    setStats(prev => {
      const newStats = { ...prev }
      const diffStats = { ...prev.timed[difficulty] }

      diffStats.played++
      diffStats.totalWins += wins
      if (wins > diffStats.bestScore) {
        diffStats.bestScore = wins
      }

      newStats.timed = { ...prev.timed, [difficulty]: diffStats }
      return newStats
    })
  }, [])

  const completeTutorial = useCallback(() => {
    setStats(prev => ({ ...prev, tutorialCompleted: true }))
  }, [])

  const resetStats = useCallback(() => {
    setStats(defaultStats)
  }, [])

  const getWinRate = useCallback((mode, difficulty) => {
    const modeStats = stats[mode]?.[difficulty]
    if (!modeStats || modeStats.played === 0) return 0
    return Math.round((modeStats.won / modeStats.played) * 100)
  }, [stats])

  const getTotalGames = useCallback(() => {
    let total = 0
    for (const diff of ['easy', 'medium', 'hard']) {
      total += stats.classic[diff].played
      total += stats.noflags[diff].played
      total += stats.timed[diff].played
    }
    return total
  }, [stats])

  const getTotalWins = useCallback(() => {
    let total = 0
    for (const diff of ['easy', 'medium', 'hard']) {
      total += stats.classic[diff].won
      total += stats.noflags[diff].won
      total += stats.timed[diff].totalWins
    }
    return total
  }, [stats])

  return {
    stats,
    recordWin,
    recordLoss,
    recordTimedSession,
    completeTutorial,
    resetStats,
    getWinRate,
    getTotalGames,
    getTotalWins
  }
}
