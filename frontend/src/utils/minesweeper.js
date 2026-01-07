// Difficulty presets
export const DIFFICULTIES = {
  easy: { rows: 8, cols: 8, mines: 10, label: 'Easy' },
  medium: { rows: 12, cols: 12, mines: 30, label: 'Medium' },
  hard: { rows: 16, cols: 16, mines: 60, label: 'Hard' }
}

// Cell states
export const CELL_STATE = {
  HIDDEN: 'hidden',
  REVEALED: 'revealed',
  FLAGGED: 'flagged'
}

// Create empty board
export function createBoard(rows, cols) {
  return Array(rows).fill(null).map(() =>
    Array(cols).fill(null).map(() => ({
      isMine: false,
      state: CELL_STATE.HIDDEN,
      adjacentMines: 0
    }))
  )
}

// Place mines randomly, avoiding first click position
export function placeMines(board, mineCount, excludeRow, excludeCol) {
  const rows = board.length
  const cols = board[0].length
  let placed = 0

  // Create exclusion zone around first click
  const isExcluded = (r, c) => {
    return Math.abs(r - excludeRow) <= 1 && Math.abs(c - excludeCol) <= 1
  }

  while (placed < mineCount) {
    const row = Math.floor(Math.random() * rows)
    const col = Math.floor(Math.random() * cols)

    if (!board[row][col].isMine && !isExcluded(row, col)) {
      board[row][col].isMine = true
      placed++
    }
  }

  // Calculate adjacent mine counts
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!board[r][c].isMine) {
        board[r][c].adjacentMines = countAdjacentMines(board, r, c)
      }
    }
  }

  return board
}

// Count mines around a cell
function countAdjacentMines(board, row, col) {
  let count = 0
  const rows = board.length
  const cols = board[0].length

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const r = row + dr
      const c = col + dc
      if (r >= 0 && r < rows && c >= 0 && c < cols && board[r][c].isMine) {
        count++
      }
    }
  }
  return count
}

// Reveal cell and cascade if empty
export function revealCell(board, row, col) {
  const rows = board.length
  const cols = board[0].length
  const cell = board[row][col]

  if (cell.state !== CELL_STATE.HIDDEN) return board

  cell.state = CELL_STATE.REVEALED

  // If empty cell, reveal adjacent cells
  if (!cell.isMine && cell.adjacentMines === 0) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue
        const r = row + dr
        const c = col + dc
        if (r >= 0 && r < rows && c >= 0 && c < cols) {
          revealCell(board, r, c)
        }
      }
    }
  }

  return board
}

// Reveal all mines (game over)
export function revealAllMines(board) {
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) {
      if (board[r][c].isMine) {
        board[r][c].state = CELL_STATE.REVEALED
      }
    }
  }
  return board
}

// Toggle flag on cell
export function toggleFlag(board, row, col) {
  const cell = board[row][col]
  if (cell.state === CELL_STATE.HIDDEN) {
    cell.state = CELL_STATE.FLAGGED
  } else if (cell.state === CELL_STATE.FLAGGED) {
    cell.state = CELL_STATE.HIDDEN
  }
  return board
}

// Check if game is won
export function checkWin(board) {
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) {
      const cell = board[r][c]
      // All non-mine cells must be revealed
      if (!cell.isMine && cell.state !== CELL_STATE.REVEALED) {
        return false
      }
    }
  }
  return true
}

// Count flags on board
export function countFlags(board) {
  let count = 0
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) {
      if (board[r][c].state === CELL_STATE.FLAGGED) {
        count++
      }
    }
  }
  return count
}
