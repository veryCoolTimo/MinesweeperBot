import { memo, useCallback, useRef } from 'react'
import { CELL_STATE } from '../utils/minesweeper'
import './Cell.css'

const NUMBER_COLORS = {
  1: 'var(--num-1)',
  2: 'var(--num-2)',
  3: 'var(--num-3)',
  4: 'var(--num-4)',
  5: 'var(--num-5)',
  6: 'var(--num-6)',
  7: 'var(--num-7)',
  8: 'var(--num-8)'
}

function Cell({ cell, row, col, onClick, onRightClick, disabled }) {
  const longPressTimer = useRef(null)
  const isLongPress = useRef(false)

  const handleTouchStart = useCallback((e) => {
    isLongPress.current = false
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true
      onRightClick(row, col)
    }, 400)
  }, [row, col, onRightClick])

  const handleTouchEnd = useCallback((e) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

    if (!isLongPress.current) {
      onClick(row, col)
    }
    isLongPress.current = false
  }, [row, col, onClick])

  const handleTouchMove = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const handleContextMenu = useCallback((e) => {
    e.preventDefault()
    onRightClick(row, col)
  }, [row, col, onRightClick])

  const handleClick = useCallback((e) => {
    e.preventDefault()
    onClick(row, col)
  }, [row, col, onClick])

  const renderContent = () => {
    if (cell.state === CELL_STATE.FLAGGED) {
      return <span className="cell-flag">🚩</span>
    }

    if (cell.state === CELL_STATE.REVEALED) {
      if (cell.isMine) {
        return <span className="cell-mine">💣</span>
      }

      if (cell.adjacentMines > 0) {
        return (
          <span
            className="cell-number"
            style={{ color: NUMBER_COLORS[cell.adjacentMines] }}
          >
            {cell.adjacentMines}
          </span>
        )
      }
    }

    return null
  }

  const cellClass = [
    'cell',
    cell.state === CELL_STATE.REVEALED && 'revealed',
    cell.state === CELL_STATE.REVEALED && cell.isMine && 'mine',
    cell.state === CELL_STATE.FLAGGED && 'flagged',
    disabled && 'disabled'
  ].filter(Boolean).join(' ')

  return (
    <button
      className={cellClass}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      disabled={disabled}
      aria-label={`Cell ${row + 1}, ${col + 1}`}
    >
      {renderContent()}
    </button>
  )
}

export default memo(Cell)
