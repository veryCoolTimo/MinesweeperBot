import { memo } from 'react'
import { DIFFICULTIES } from '../utils/minesweeper'
import './Header.css'

function Header({
  time,
  flagCount,
  mineCount,
  difficulty,
  gameState,
  onDifficultyChange,
  onNewGame
}) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="header">
      <div className="header-top">
        <div className="stat">
          <span className="stat-icon">💣</span>
          <span className="stat-value">{mineCount - flagCount}</span>
        </div>

        <button
          className={`new-game-btn ${gameState === 'won' ? 'won' : gameState === 'lost' ? 'lost' : ''}`}
          onClick={onNewGame}
        >
          {gameState === 'won' ? '😎' : gameState === 'lost' ? '😵' : '🙂'}
        </button>

        <div className="stat">
          <span className="stat-icon">⏱️</span>
          <span className="stat-value">{formatTime(time)}</span>
        </div>
      </div>

      <div className="difficulty-selector">
        {Object.entries(DIFFICULTIES).map(([key, value]) => (
          <button
            key={key}
            className={`difficulty-btn ${difficulty === key ? 'active' : ''}`}
            onClick={() => onDifficultyChange(key)}
          >
            {value.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default memo(Header)
