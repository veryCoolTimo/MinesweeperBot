import './MemoryCell.css'

function MemoryCell({ index, isActive, isClicked, isInput, showNumber, number, onClick, disabled }) {
  const handleClick = () => {
    if (!disabled && isInput) {
      onClick(index)
    }
  }

  return (
    <div
      className={`memory-cell ${isActive ? 'active' : ''} ${isClicked ? 'clicked' : ''} ${isInput ? 'input-mode' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={handleClick}
    >
      <div className="cell-inner">
        {isActive && showNumber && (
          <span className="cell-number">{number}</span>
        )}
      </div>
    </div>
  )
}

export default MemoryCell
