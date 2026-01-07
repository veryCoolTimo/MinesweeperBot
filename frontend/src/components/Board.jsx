import { memo } from 'react'
import Cell from './Cell'
import './Board.css'

function Board({ board, onCellClick, disabled }) {
  const rows = board.length
  const cols = board[0]?.length || 0

  return (
    <div
      className="board"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`
      }}
    >
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <Cell
            key={`${rowIndex}-${colIndex}`}
            cell={cell}
            row={rowIndex}
            col={colIndex}
            onClick={onCellClick}
            disabled={disabled}
          />
        ))
      )}
    </div>
  )
}

export default memo(Board)
