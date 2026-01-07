import { memo } from 'react'
import './GameOverModal.css'

function GameOverModal({ isOpen, isWin, time, isTimed, efficiency, bv3PerSecond, board3BV, clickCount, onNewGame, onClose }) {
  if (!isOpen) return null

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Get star rating based on efficiency
  const getStars = (eff) => {
    if (eff >= 100) return { stars: '⭐⭐⭐', label: 'Perfect!' }
    if (eff >= 85) return { stars: '⭐⭐⭐', label: 'Excellent!' }
    if (eff >= 70) return { stars: '⭐⭐', label: 'Great!' }
    if (eff >= 50) return { stars: '⭐', label: 'Good' }
    return { stars: '', label: 'Keep practicing!' }
  }

  // Get speed rating based on 3BV/s
  const getSpeedRating = (bvs) => {
    const speed = parseFloat(bvs)
    if (speed >= 2.0) return 'Pro'
    if (speed >= 1.5) return 'Expert'
    if (speed >= 1.0) return 'Advanced'
    if (speed >= 0.5) return 'Intermediate'
    return 'Beginner'
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

  const rating = isWin ? getStars(efficiency) : null
  const speedRating = isWin ? getSpeedRating(bv3PerSecond) : null

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
          <>
            <p className="modal-time">
              Time: <strong>{formatTime(time)}</strong>
            </p>

            {/* Efficiency Stats */}
            <div className="efficiency-stats">
              <div className="efficiency-row">
                <span className="efficiency-label">Efficiency</span>
                <span className="efficiency-value">{efficiency}%</span>
              </div>
              <div className="efficiency-row">
                <span className="efficiency-label">3BV/s</span>
                <span className="efficiency-value">{bv3PerSecond}</span>
              </div>
              <div className="efficiency-row small">
                <span className="efficiency-label">Clicks</span>
                <span className="efficiency-value">{clickCount} / {board3BV} min</span>
              </div>
            </div>

            {/* Star Rating */}
            <div className="star-rating">
              <div className="stars">{rating.stars}</div>
              <div className="rating-label">{rating.label}</div>
              <div className="speed-badge">{speedRating}</div>
            </div>
          </>
        )}

        {!isWin && (
          <p className="modal-subtitle">
            Oops! You hit a mine.
          </p>
        )}

        <button className="modal-btn primary" onClick={onNewGame}>
          Play Again
        </button>
      </div>
    </div>
  )
}

export default memo(GameOverModal)
