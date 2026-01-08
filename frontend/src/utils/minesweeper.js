// Difficulty presets
export const DIFFICULTIES = {
  easy: { rows: 8, cols: 8, mines: 10, label: 'Easy' },
  medium: { rows: 12, cols: 12, mines: 30, label: 'Medium' },
  hard: { rows: 16, cols: 16, mines: 60, label: 'Hard' }
}

// Seeded random number generator (mulberry32)
function createSeededRandom(seed) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }

  let state = hash >>> 0

  return function() {
    state |= 0
    state = state + 0x6D2B79F5 | 0
    let t = Math.imul(state ^ state >>> 15, 1 | state)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
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

// Get neighbors of a cell
function getNeighbors(rows, cols, row, col) {
  const neighbors = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const r = row + dr
      const c = col + dc
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        neighbors.push([r, c])
      }
    }
  }
  return neighbors
}

// Count mines around a cell
function countAdjacentMines(board, row, col) {
  const rows = board.length
  const cols = board[0].length
  let count = 0

  for (const [r, c] of getNeighbors(rows, cols, row, col)) {
    if (board[r][c].isMine) count++
  }
  return count
}

// Deep clone board for solver
function cloneBoard(board) {
  return board.map(row => row.map(cell => ({ ...cell })))
}

// Solver: check if board is solvable without guessing
function isSolvable(board, startRow, startCol) {
  const rows = board.length
  const cols = board[0].length
  const testBoard = cloneBoard(board)

  // Track known states: 'safe', 'mine', or 'unknown'
  const known = Array(rows).fill(null).map(() => Array(cols).fill('unknown'))

  // Mark mines
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (testBoard[r][c].isMine) {
        known[r][c] = 'mine'
      }
    }
  }

  // Simulate first click reveal
  const revealed = new Set()
  const toReveal = [[startRow, startCol]]

  while (toReveal.length > 0) {
    const [r, c] = toReveal.pop()
    const key = `${r},${c}`
    if (revealed.has(key)) continue
    if (testBoard[r][c].isMine) continue

    revealed.add(key)
    known[r][c] = 'safe'

    if (testBoard[r][c].adjacentMines === 0) {
      for (const [nr, nc] of getNeighbors(rows, cols, r, c)) {
        if (!revealed.has(`${nr},${nc}`)) {
          toReveal.push([nr, nc])
        }
      }
    }
  }

  // Count how many non-mine cells we need to reveal
  let totalSafe = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!testBoard[r][c].isMine) totalSafe++
    }
  }

  // Solving loop
  let progress = true
  let iterations = 0
  const maxIterations = 1000

  while (progress && revealed.size < totalSafe && iterations < maxIterations) {
    progress = false
    iterations++

    // For each revealed cell with a number
    for (const key of revealed) {
      const [r, c] = key.split(',').map(Number)
      const cell = testBoard[r][c]
      if (cell.adjacentMines === 0) continue

      const neighbors = getNeighbors(rows, cols, r, c)
      const hiddenNeighbors = []
      let flaggedCount = 0

      for (const [nr, nc] of neighbors) {
        if (known[nr][nc] === 'mine') {
          flaggedCount++
        } else if (!revealed.has(`${nr},${nc}`)) {
          hiddenNeighbors.push([nr, nc])
        }
      }

      // Rule 1: If flagged count == number, all hidden neighbors are safe
      if (flaggedCount === cell.adjacentMines && hiddenNeighbors.length > 0) {
        for (const [nr, nc] of hiddenNeighbors) {
          if (known[nr][nc] === 'unknown') {
            known[nr][nc] = 'safe'
            revealed.add(`${nr},${nc}`)
            progress = true

            // Cascade if empty
            if (testBoard[nr][nc].adjacentMines === 0) {
              const cascade = [[nr, nc]]
              while (cascade.length > 0) {
                const [cr, cc] = cascade.pop()
                for (const [nnr, nnc] of getNeighbors(rows, cols, cr, cc)) {
                  const nkey = `${nnr},${nnc}`
                  if (!revealed.has(nkey) && !testBoard[nnr][nnc].isMine) {
                    revealed.add(nkey)
                    known[nnr][nnc] = 'safe'
                    if (testBoard[nnr][nnc].adjacentMines === 0) {
                      cascade.push([nnr, nnc])
                    }
                  }
                }
              }
            }
          }
        }
      }

      // Rule 2: If hidden count == remaining mines, all hidden are mines
      const remainingMines = cell.adjacentMines - flaggedCount
      if (remainingMines === hiddenNeighbors.length && hiddenNeighbors.length > 0) {
        for (const [nr, nc] of hiddenNeighbors) {
          if (known[nr][nc] === 'unknown') {
            known[nr][nc] = 'mine'
            progress = true
          }
        }
      }
    }

    // Advanced: subset/superset analysis
    if (!progress) {
      const constraints = []

      for (const key of revealed) {
        const [r, c] = key.split(',').map(Number)
        const cell = testBoard[r][c]
        if (cell.adjacentMines === 0) continue

        const neighbors = getNeighbors(rows, cols, r, c)
        const unknownNeighbors = []
        let flaggedCount = 0

        for (const [nr, nc] of neighbors) {
          if (known[nr][nc] === 'mine') {
            flaggedCount++
          } else if (known[nr][nc] === 'unknown') {
            unknownNeighbors.push(`${nr},${nc}`)
          }
        }

        const remainingMines = cell.adjacentMines - flaggedCount
        if (unknownNeighbors.length > 0 && remainingMines >= 0) {
          constraints.push({
            cells: new Set(unknownNeighbors),
            mines: remainingMines
          })
        }
      }

      // Compare pairs of constraints
      for (let i = 0; i < constraints.length; i++) {
        for (let j = i + 1; j < constraints.length; j++) {
          const c1 = constraints[i]
          const c2 = constraints[j]

          // Check if c1 is subset of c2
          const c1InC2 = [...c1.cells].every(cell => c2.cells.has(cell))
          const c2InC1 = [...c2.cells].every(cell => c1.cells.has(cell))

          if (c1InC2 && c1.cells.size < c2.cells.size) {
            // c1 is proper subset of c2
            const diff = [...c2.cells].filter(cell => !c1.cells.has(cell))
            const diffMines = c2.mines - c1.mines

            if (diffMines === 0) {
              // All diff cells are safe
              for (const cellKey of diff) {
                const [nr, nc] = cellKey.split(',').map(Number)
                if (known[nr][nc] === 'unknown') {
                  known[nr][nc] = 'safe'
                  revealed.add(cellKey)
                  progress = true
                }
              }
            } else if (diffMines === diff.length) {
              // All diff cells are mines
              for (const cellKey of diff) {
                const [nr, nc] = cellKey.split(',').map(Number)
                if (known[nr][nc] === 'unknown') {
                  known[nr][nc] = 'mine'
                  progress = true
                }
              }
            }
          }

          if (c2InC1 && c2.cells.size < c1.cells.size) {
            // c2 is proper subset of c1
            const diff = [...c1.cells].filter(cell => !c2.cells.has(cell))
            const diffMines = c1.mines - c2.mines

            if (diffMines === 0) {
              for (const cellKey of diff) {
                const [nr, nc] = cellKey.split(',').map(Number)
                if (known[nr][nc] === 'unknown') {
                  known[nr][nc] = 'safe'
                  revealed.add(cellKey)
                  progress = true
                }
              }
            } else if (diffMines === diff.length) {
              for (const cellKey of diff) {
                const [nr, nc] = cellKey.split(',').map(Number)
                if (known[nr][nc] === 'unknown') {
                  known[nr][nc] = 'mine'
                  progress = true
                }
              }
            }
          }
        }
      }
    }
  }

  return revealed.size >= totalSafe
}

// Place mines with solvability guarantee
export function placeMines(board, mineCount, excludeRow, excludeCol) {
  const rows = board.length
  const cols = board[0].length
  const maxAttempts = 100

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Reset board
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        board[r][c].isMine = false
        board[r][c].adjacentMines = 0
      }
    }

    // Create exclusion zone around first click
    const isExcluded = (r, c) => {
      return Math.abs(r - excludeRow) <= 1 && Math.abs(c - excludeCol) <= 1
    }

    // Place mines randomly
    let placed = 0
    let placeAttempts = 0
    while (placed < mineCount && placeAttempts < 10000) {
      placeAttempts++
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

    // Check solvability
    if (isSolvable(board, excludeRow, excludeCol)) {
      console.log(`Solvable board found on attempt ${attempt + 1}`)
      return board
    }
  }

  // Fallback: return last generated board even if not perfectly solvable
  console.log('Could not find perfectly solvable board, using best effort')
  return board
}

// Place mines with a seed for multiplayer (deterministic)
export function placeMinesSeeded(board, mineCount, excludeRow, excludeCol, seed) {
  const rows = board.length
  const cols = board[0].length
  const random = createSeededRandom(seed)

  // Reset board
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      board[r][c].isMine = false
      board[r][c].adjacentMines = 0
    }
  }

  // Create exclusion zone around first click
  const isExcluded = (r, c) => {
    return Math.abs(r - excludeRow) <= 1 && Math.abs(c - excludeCol) <= 1
  }

  // Get all valid positions
  const validPositions = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!isExcluded(r, c)) {
        validPositions.push([r, c])
      }
    }
  }

  // Shuffle positions using seeded random (Fisher-Yates)
  for (let i = validPositions.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[validPositions[i], validPositions[j]] = [validPositions[j], validPositions[i]]
  }

  // Place mines in first N positions
  for (let i = 0; i < Math.min(mineCount, validPositions.length); i++) {
    const [r, c] = validPositions[i]
    board[r][c].isMine = true
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

// Reveal cell and cascade if empty
export function revealCell(board, row, col) {
  const rows = board.length
  const cols = board[0].length
  const cell = board[row][col]

  if (cell.state !== CELL_STATE.HIDDEN) return board

  cell.state = CELL_STATE.REVEALED

  // If empty cell, reveal adjacent cells
  if (!cell.isMine && cell.adjacentMines === 0) {
    for (const [r, c] of getNeighbors(rows, cols, row, col)) {
      revealCell(board, r, c)
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

// Calculate 3BV (Bechtel's Board Benchmark Value)
// This is the minimum number of clicks needed to solve the board
export function calculate3BV(board) {
  const rows = board.length
  const cols = board[0].length
  const visited = Array(rows).fill(null).map(() => Array(cols).fill(false))

  let bv3 = 0

  // First pass: count openings (connected regions of zeros)
  // Each opening counts as 1 click
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!board[r][c].isMine &&
          board[r][c].adjacentMines === 0 &&
          !visited[r][c]) {
        // Found an opening - BFS to mark all connected zeros and their border
        bv3++
        const queue = [[r, c]]

        while (queue.length > 0) {
          const [cr, cc] = queue.shift()
          if (visited[cr][cc]) continue
          visited[cr][cc] = true

          // If this is a zero, explore neighbors
          if (board[cr][cc].adjacentMines === 0) {
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue
                const nr = cr + dr
                const nc = cc + dc
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
                    !board[nr][nc].isMine && !visited[nr][nc]) {
                  queue.push([nr, nc])
                }
              }
            }
          }
        }
      }
    }
  }

  // Second pass: count isolated numbered cells
  // (numbered cells not revealed by any opening)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!board[r][c].isMine &&
          board[r][c].adjacentMines > 0 &&
          !visited[r][c]) {
        bv3++
      }
    }
  }

  return bv3
}
