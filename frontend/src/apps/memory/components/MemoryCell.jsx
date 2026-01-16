import './MemoryCell.css'

function MemoryCell({ index, isActive, isInput, showNumber, number, onClick, disabled }) {
  const handleClick = () => {
    if (!disabled && isInput) {
      onClick(index)
    }
  }

  return (
    <div
      className={`memory-cell ${isActive ? 'active' : ''} ${isInput ? 'input-mode' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={handleClick}
    >
      {isActive && showNumber && (
        <span className="cell-number">{number}</span>
      )}
    </div>
  )
}

export default MemoryCell
