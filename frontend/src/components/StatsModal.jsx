import { memo } from 'react'
import './StatsModal.css'

function formatTime(seconds) {
  if (seconds === null) return '--:--'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function StatsModal({ stats, onClose, onReset }) {
  const { classic, timed, noflags, currentStreak, bestStreak } = stats

  return (
    <div className="stats-overlay" onClick={onClose}>
      <div className="stats-modal" onClick={e => e.stopPropagation()}>
        <h2 className="stats-title">Statistics</h2>

        {/* Streak */}
        <div className="stats-streak">
          <div className="streak-item">
            <span className="streak-value">{currentStreak}</span>
            <span className="streak-label">Current Streak</span>
          </div>
          <div className="streak-divider" />
          <div className="streak-item">
            <span className="streak-value">{bestStreak}</span>
            <span className="streak-label">Best Streak</span>
          </div>
        </div>

        {/* Classic Stats */}
        <div className="stats-section">
          <h3 className="stats-section-title">🎮 Classic</h3>
          <div className="stats-grid">
            {['easy', 'medium', 'hard'].map(diff => (
              <div key={diff} className="stats-card">
                <span className="stats-card-title">{diff.charAt(0).toUpperCase() + diff.slice(1)}</span>
                <div className="stats-card-row">
                  <span>Played</span>
                  <span>{classic[diff].played}</span>
                </div>
                <div className="stats-card-row">
                  <span>Won</span>
                  <span>{classic[diff].won}</span>
                </div>
                <div className="stats-card-row">
                  <span>Win Rate</span>
                  <span>
                    {classic[diff].played > 0
                      ? Math.round((classic[diff].won / classic[diff].played) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="stats-card-row highlight">
                  <span>Best Time</span>
                  <span>{formatTime(classic[diff].bestTime)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timed Stats */}
        <div className="stats-section">
          <h3 className="stats-section-title">⏱️ Timed</h3>
          <div className="stats-grid">
            {['easy', 'medium', 'hard'].map(diff => (
              <div key={diff} className="stats-card">
                <span className="stats-card-title">{diff.charAt(0).toUpperCase() + diff.slice(1)}</span>
                <div className="stats-card-row">
                  <span>Sessions</span>
                  <span>{timed[diff].played}</span>
                </div>
                <div className="stats-card-row highlight">
                  <span>Best Score</span>
                  <span>{timed[diff].bestScore}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* No Flags Stats */}
        <div className="stats-section">
          <h3 className="stats-section-title">🚫 No Flags</h3>
          <div className="stats-grid">
            {['easy', 'medium', 'hard'].map(diff => (
              <div key={diff} className="stats-card">
                <span className="stats-card-title">{diff.charAt(0).toUpperCase() + diff.slice(1)}</span>
                <div className="stats-card-row">
                  <span>Won</span>
                  <span>{noflags[diff].won}/{noflags[diff].played}</span>
                </div>
                <div className="stats-card-row highlight">
                  <span>Best Time</span>
                  <span>{formatTime(noflags[diff].bestTime)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="stats-buttons">
          <button className="stats-reset" onClick={onReset}>
            Reset Stats
          </button>
          <button className="stats-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default memo(StatsModal)
