import { memo } from 'react'
import './GameOverModal.css'

function GameOverModal({ isOpen, isWin, time, onNewGame, onClose }) {
  if (!isOpen) return null

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className={`modal-icon ${isWin ? 'win' : 'lose'}`}>
          {isWin ? '🎉' : '💥'}
        </div>

        <h2 className="modal-title">
          {isWin ? 'You Won!' : 'Game Over'}
        </h2>

        {isWin && (
          <p className="modal-time">
            Time: <strong>{formatTime(time)}</strong>
          </p>
        )}

        <p className="modal-subtitle">
          {isWin
            ? 'Congratulations! You cleared the minefield!'
            : 'Oops! You hit a mine.'
          }
        </p>

        <button className="modal-btn primary" onClick={onNewGame}>
          Play Again
        </button>
      </div>
    </div>
  )
}

export default memo(GameOverModal)
