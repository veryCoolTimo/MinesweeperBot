import { useState, useCallback, useRef, useEffect } from 'react'
import {
  DIFFICULTIES,
  CELL_STATE,
  createBoard,
  placeMines,
  revealCell,
  revealAllMines,
  toggleFlag,
  checkWin,
  countFlags
} from '../utils/minesweeper'

export const GAME_STATE = {
  IDLE: 'idle',
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost'
}

export function useGame(initialDifficulty = 'easy') {
  const [difficulty, setDifficulty] = useState(initialDifficulty)
  const [board, setBoard] = useState(() => {
    const { rows, cols } = DIFFICULTIES[initialDifficulty]
    return createBoard(rows, cols)
  })
  const [gameState, setGameState] = useState(GAME_STATE.IDLE)
  const [time, setTime] = useState(0)
  const [flagCount, setFlagCount] = useState(0)
  const [firstClick, setFirstClick] = useState(true)
  const timerRef = useRef(null)

  const config = DIFFICULTIES[difficulty]

  // Timer logic
  useEffect(() => {
    if (gameState === GAME_STATE.PLAYING) {
      timerRef.current = setInterval(() => {
        setTime(t => t + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [gameState])

  const startNewGame = useCallback((newDifficulty) => {
    const diff = newDifficulty || difficulty
    const { rows, cols } = DIFFICULTIES[diff]

    setDifficulty(diff)
    setBoard(createBoard(rows, cols))
    setGameState(GAME_STATE.IDLE)
    setTime(0)
    setFlagCount(0)
    setFirstClick(true)
  }, [difficulty])

  // Get neighbors helper
  const getNeighbors = (r, c) => {
    const neighbors = []
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue
        const nr = r + dr
        const nc = c + dc
        if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols) {
          neighbors.push([nr, nc])
        }
      }
    }
    return neighbors
  }

  const handleCellClick = useCallback((row, col) => {
    if (gameState === GAME_STATE.WON || gameState === GAME_STATE.LOST) {
      return { action: 'none' }
    }

    const cell = board[row][col]

    if (cell.state === CELL_STATE.FLAGGED) {
      return { action: 'none' }
    }

    // Chord: if clicking revealed cell with number, try to reveal neighbors
    if (cell.state === CELL_STATE.REVEALED && cell.adjacentMines > 0) {
      const neighbors = getNeighbors(row, col)
      let flaggedCount = 0
      let hiddenNeighbors = []

      for (const [nr, nc] of neighbors) {
        if (board[nr][nc].state === CELL_STATE.FLAGGED) {
          flaggedCount++
        } else if (board[nr][nc].state === CELL_STATE.HIDDEN) {
          hiddenNeighbors.push([nr, nc])
        }
      }

      // If flagged count matches the number, reveal all hidden neighbors
      if (flaggedCount === cell.adjacentMines && hiddenNeighbors.length > 0) {
        let newBoard = [...board.map(r => [...r.map(c => ({ ...c }))])]
        let hitMine = false

        for (const [nr, nc] of hiddenNeighbors) {
          newBoard = revealCell(newBoard, nr, nc)
          if (newBoard[nr][nc].isMine) {
            hitMine = true
          }
        }

        if (hitMine) {
          newBoard = revealAllMines(newBoard)
          setBoard(newBoard)
          setGameState(GAME_STATE.LOST)
          return { action: 'lost' }
        }

        if (checkWin(newBoard)) {
          setBoard(newBoard)
          setGameState(GAME_STATE.WON)
          return { action: 'won', time: time * 1000 }
        }

        setBoard(newBoard)
        return { action: 'chord' }
      }

      return { action: 'none' }
    }

    if (cell.state === CELL_STATE.REVEALED) {
      return { action: 'none' }
    }

    let newBoard = [...board.map(r => [...r.map(c => ({ ...c }))])]

    // First click - place mines
    if (firstClick) {
      newBoard = placeMines(newBoard, config.mines, row, col)
      setFirstClick(false)
      setGameState(GAME_STATE.PLAYING)
    }

    // Reveal cell
    newBoard = revealCell(newBoard, row, col)
    const clickedCell = newBoard[row][col]

    // Check for mine hit
    if (clickedCell.isMine) {
      newBoard = revealAllMines(newBoard)
      setBoard(newBoard)
      setGameState(GAME_STATE.LOST)
      return { action: 'lost' }
    }

    // Check for win
    if (checkWin(newBoard)) {
      setBoard(newBoard)
      setGameState(GAME_STATE.WON)
      return { action: 'won', time: time * 1000 }
    }

    setBoard(newBoard)
    return { action: 'reveal' }
  }, [board, gameState, firstClick, config.mines, time])

  const handleCellRightClick = useCallback((row, col) => {
    if (gameState === GAME_STATE.WON || gameState === GAME_STATE.LOST) {
      return { action: 'none' }
    }

    const cell = board[row][col]

    if (cell.state === CELL_STATE.REVEALED) {
      return { action: 'none' }
    }

    // Start game on first flag too
    if (gameState === GAME_STATE.IDLE) {
      setGameState(GAME_STATE.PLAYING)
    }

    const newBoard = [...board.map(r => [...r.map(c => ({ ...c }))])]
    toggleFlag(newBoard, row, col)
    setBoard(newBoard)
    setFlagCount(countFlags(newBoard))

    return { action: newBoard[row][col].state === CELL_STATE.FLAGGED ? 'flag' : 'unflag' }
  }, [board, gameState])

  return {
    board,
    gameState,
    difficulty,
    time,
    flagCount,
    mineCount: config.mines,
    config,
    startNewGame,
    handleCellClick,
    handleCellRightClick
  }
}
