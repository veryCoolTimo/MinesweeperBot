import { memo } from 'react'
import './GameOverModal.css'

function GameOverModal({ isOpen, isWin, time, isTimed, onNewGame, onClose }) {
  if (!isOpen) return null

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Timed mode end
  if (isTimed) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-icon win">⏱️</div>

          <h2 className="modal-title">Time's Up!</h2>

          <p className="modal-time">
            You won <strong>{time}</strong> {time === 1 ? 'game' : 'games'}!
          </p>

          <p className="modal-subtitle">
            {time === 0
              ? 'Better luck next time!'
              : time < 3
                ? 'Good effort! Try to beat your record!'
                : 'Amazing speed! You\'re a pro!'}
          </p>

          <button className="modal-btn primary" onClick={onNewGame}>
            Play Again
          </button>
        </div>
      </div>
    )
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
