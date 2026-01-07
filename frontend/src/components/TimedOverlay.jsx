import { memo } from 'react'
import './TimedOverlay.css'

function TimedOverlay({ timeLeft, wins, onEnd }) {
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  const isLowTime = timeLeft <= 30
  const isCritical = timeLeft <= 10

  return (
    <div className="timed-overlay">
      <div className={`timed-timer ${isLowTime ? 'low' : ''} ${isCritical ? 'critical' : ''}`}>
        {minutes}:{seconds.toString().padStart(2, '0')}
      </div>
      <div className="timed-wins">
        <span className="timed-wins-value">{wins}</span>
        <span className="timed-wins-label">wins</span>
      </div>
    </div>
  )
}

export default memo(TimedOverlay)
