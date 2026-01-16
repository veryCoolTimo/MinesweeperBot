import MemoryCell from './MemoryCell'
import './MemoryBoard.css'

function MemoryBoard({
  gridSize,
  activeCell,
  clickedCell,
  showingIndex,
  sequence,
  isInput,
  disabled,
  onCellClick
}) {
  const cells = []
  const totalCells = gridSize * gridSize

  for (let i = 0; i < totalCells; i++) {
    const isActive = activeCell === i
    const isClicked = clickedCell === i
    const showNumber = isActive && showingIndex >= 0

    cells.push(
      <MemoryCell
        key={i}
        index={i}
        isActive={isActive}
        isClicked={isClicked}
        isInput={isInput}
        showNumber={showNumber}
        number={showingIndex + 1}
        onClick={onCellClick}
        disabled={disabled}
      />
    )
  }

  return (
    <div
      className="memory-board"
      style={{
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gridTemplateRows: `repeat(${gridSize}, 1fr)`
      }}
    >
      {cells}
    </div>
  )
}

export default MemoryBoard
