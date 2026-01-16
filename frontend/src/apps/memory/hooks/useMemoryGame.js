import { useState, useCallback, useRef, useEffect } from 'react'

export const GAME_STATE = {
  IDLE: 'idle',
  SHOWING: 'showing',
  INPUT: 'input',
  WON: 'won',
  LOST: 'lost'
}

export const DIFFICULTIES = {
  easy: {
    name: 'Easy',
    gridSize: 3,
    startLength: 3,
    showTime: 800,
    maxLevel: 10
  },
  medium: {
    name: 'Medium',
    gridSize: 4,
    startLength: 4,
    showTime: 600,
    maxLevel: 15
  },
  hard: {
    name: 'Hard',
    gridSize: 5,
    startLength: 5,
    showTime: 400,
    maxLevel: 20
  }
}

export function useMemoryGame(initialDifficulty = 'easy') {
  const [difficulty, setDifficulty] = useState(initialDifficulty)
  const [gameState, setGameState] = useState(GAME_STATE.IDLE)
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('memoryHighScore')
    return saved ? JSON.parse(saved) : { easy: 0, medium: 0, hard: 0 }
  })

  const [sequence, setSequence] = useState([])
  const [userSequence, setUserSequence] = useState([])
  const [activeCell, setActiveCell] = useState(null)
  const [showingIndex, setShowingIndex] = useState(-1)

  const timeoutRef = useRef(null)
  const config = DIFFICULTIES[difficulty]

  // Save high score
  useEffect(() => {
    localStorage.setItem('memoryHighScore', JSON.stringify(highScore))
  }, [highScore])

  // Generate a random sequence
  const generateSequence = useCallback((length) => {
    const totalCells = config.gridSize * config.gridSize
    const seq = []
    for (let i = 0; i < length; i++) {
      seq.push(Math.floor(Math.random() * totalCells))
    }
    return seq
  }, [config.gridSize])

  // Show the sequence to the player
  const showSequence = useCallback((seq) => {
    setGameState(GAME_STATE.SHOWING)
    setShowingIndex(-1)

    let index = 0

    const showNext = () => {
      if (index < seq.length) {
        setShowingIndex(index)
        setActiveCell(seq[index])

        timeoutRef.current = setTimeout(() => {
          setActiveCell(null)
          index++

          timeoutRef.current = setTimeout(() => {
            showNext()
          }, 200) // Gap between cells
        }, config.showTime)
      } else {
        setShowingIndex(-1)
        setGameState(GAME_STATE.INPUT)
      }
    }

    // Initial delay before showing
    timeoutRef.current = setTimeout(showNext, 500)
  }, [config.showTime])

  // Start a new game
  const startGame = useCallback((newDifficulty) => {
    if (newDifficulty) {
      setDifficulty(newDifficulty)
    }

    const cfg = newDifficulty ? DIFFICULTIES[newDifficulty] : config
    const initialLength = cfg.startLength
    const newSequence = generateSequence(initialLength)

    setLevel(1)
    setScore(0)
    setSequence(newSequence)
    setUserSequence([])

    // Small delay then show sequence
    setTimeout(() => showSequence(newSequence), 300)
  }, [config, generateSequence, showSequence])

  // Handle cell click
  const handleCellClick = useCallback((cellIndex) => {
    if (gameState !== GAME_STATE.INPUT) return null

    const newUserSequence = [...userSequence, cellIndex]
    setUserSequence(newUserSequence)

    // Check if correct
    const expectedIndex = userSequence.length
    const isCorrect = sequence[expectedIndex] === cellIndex

    if (!isCorrect) {
      // Wrong! Game over
      setGameState(GAME_STATE.LOST)

      // Update high score if needed
      if (score > highScore[difficulty]) {
        setHighScore(prev => ({ ...prev, [difficulty]: score }))
      }

      return { action: 'wrong', correct: sequence[expectedIndex], clicked: cellIndex }
    }

    // Correct click
    if (newUserSequence.length === sequence.length) {
      // Level complete!
      const levelScore = level * 10 * (difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1)
      const newScore = score + levelScore
      setScore(newScore)

      if (level >= config.maxLevel) {
        // Won the game!
        setGameState(GAME_STATE.WON)
        if (newScore > highScore[difficulty]) {
          setHighScore(prev => ({ ...prev, [difficulty]: newScore }))
        }
        return { action: 'won', score: newScore }
      }

      // Next level
      const newLevel = level + 1
      setLevel(newLevel)

      // Generate longer sequence
      const newLength = config.startLength + newLevel - 1
      const newSequence = generateSequence(newLength)
      setSequence(newSequence)
      setUserSequence([])

      // Show new sequence after delay
      setTimeout(() => showSequence(newSequence), 1000)

      return { action: 'levelUp', level: newLevel, score: newScore }
    }

    return { action: 'correct', remaining: sequence.length - newUserSequence.length }
  }, [gameState, userSequence, sequence, level, score, difficulty, highScore, config, generateSequence, showSequence])

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    // State
    gameState,
    difficulty,
    level,
    score,
    highScore: highScore[difficulty],
    sequence,
    userSequence,
    activeCell,
    showingIndex,
    gridSize: config.gridSize,
    sequenceLength: sequence.length,

    // Actions
    startGame,
    handleCellClick,
    setDifficulty
  }
}
