import { memo } from 'react'
import './ModeSelector.css'

const MODES = [
  { id: 'classic', label: 'Classic', icon: '🎮', desc: 'Standard minesweeper' },
  { id: 'timed', label: 'Timed', icon: '⏱️', desc: '3 min, max wins' },
  { id: 'noflags', label: 'No Flags', icon: '🚫', desc: 'Hardcore mode' },
  { id: 'tutorial', label: 'Tutorial', icon: '📖', desc: 'Learn to play' }
]

function ModeSelector({ currentMode, onModeChange, onClose }) {
  return (
    <div className="mode-overlay" onClick={onClose}>
      <div className="mode-selector" onClick={e => e.stopPropagation()}>
        <h2 className="mode-title">Game Mode</h2>

        <div className="mode-list">
          {MODES.map(mode => (
            <button
              key={mode.id}
              className={`mode-item ${currentMode === mode.id ? 'active' : ''}`}
              onClick={() => onModeChange(mode.id)}
            >
              <span className="mode-icon">{mode.icon}</span>
              <div className="mode-info">
                <span className="mode-label">{mode.label}</span>
                <span className="mode-desc">{mode.desc}</span>
              </div>
              {currentMode === mode.id && <span className="mode-check">✓</span>}
            </button>
          ))}
        </div>

        <button className="mode-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}

export default memo(ModeSelector)
