import { memo, useEffect, useCallback } from 'react'
import { useDuel, DUEL_STATE } from '../hooks/useDuel'
import './DuelMode.css'

function DuelMode({
  userId,
  username,
  difficulty,
  progress,
  isGameOver,
  isWin,
  time,
  onStartGame,
  onClose
}) {
  const {
    duelState,
    match,
    opponent,
    myProgress,
    opponentProgress,
    countdown,
    findMatch,
    updateProgress,
    reportFinished,
    cancelSearch,
    leaveMatch
  } = useDuel(userId, username)

  // Start searching when component mounts
  useEffect(() => {
    if (duelState === DUEL_STATE.IDLE) {
      findMatch(difficulty)
    }
  }, [])

  // Update progress when it changes
  useEffect(() => {
    if (duelState === DUEL_STATE.PLAYING && progress > 0) {
      updateProgress(progress, Math.round(progress))
    }
  }, [progress, duelState, updateProgress])

  // Report game result
  useEffect(() => {
    if (duelState === DUEL_STATE.PLAYING && isGameOver) {
      reportFinished(isWin, time)
    }
  }, [isGameOver, isWin, time, duelState, reportFinished])

  // Start the game when countdown finishes
  useEffect(() => {
    if (duelState === DUEL_STATE.PLAYING && match?.seed) {
      onStartGame(match.seed)
    }
  }, [duelState, match, onStartGame])

  const handleCancel = useCallback(() => {
    cancelSearch()
    onClose()
  }, [cancelSearch, onClose])

  const handlePlayAgain = useCallback(() => {
    leaveMatch()
    findMatch(difficulty)
  }, [leaveMatch, findMatch, difficulty])

  const handleExit = useCallback(() => {
    leaveMatch()
    onClose()
  }, [leaveMatch, onClose])

  // Searching state
  if (duelState === DUEL_STATE.SEARCHING) {
    return (
      <div className="duel-overlay">
        <div className="duel-modal">
          <div className="duel-searching">
            <div className="searching-spinner"></div>
            <h2>Searching for opponent...</h2>
            <p className="searching-hint">Difficulty: {difficulty}</p>
            <button className="duel-btn secondary" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Found opponent, countdown
  if (duelState === DUEL_STATE.FOUND && countdown !== null) {
    return (
      <div className="duel-overlay">
        <div className="duel-modal">
          <div className="duel-found">
            <h2>Opponent Found!</h2>
            <div className="opponent-info">
              <span className="opponent-avatar">👤</span>
              <span className="opponent-name">{opponent?.username || 'Player'}</span>
            </div>
            <div className="countdown">
              <span className="countdown-number">{countdown}</span>
            </div>
            <p className="countdown-text">Get ready!</p>
          </div>
        </div>
      </div>
    )
  }

  // Playing state - show progress bar overlay
  if (duelState === DUEL_STATE.PLAYING) {
    return (
      <div className="duel-progress-bar">
        <div className="progress-item you">
          <span className="progress-label">You</span>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${myProgress}%` }}
            />
          </div>
          <span className="progress-percent">{Math.round(myProgress)}%</span>
        </div>
        <div className="progress-item opponent">
          <span className="progress-label">{opponent?.username || 'Opponent'}</span>
          <div className="progress-track">
            <div
              className="progress-fill opponent"
              style={{ width: `${opponentProgress}%` }}
            />
          </div>
          <span className="progress-percent">{Math.round(opponentProgress)}%</span>
        </div>
      </div>
    )
  }

  // Won state
  if (duelState === DUEL_STATE.WON) {
    return (
      <div className="duel-overlay">
        <div className="duel-modal">
          <div className="duel-result win">
            <div className="result-icon">🏆</div>
            <h2>You Won!</h2>
            <p className="result-time">Time: {formatTime(time)}</p>
            <div className="result-buttons">
              <button className="duel-btn primary" onClick={handlePlayAgain}>
                Play Again
              </button>
              <button className="duel-btn secondary" onClick={handleExit}>
                Exit
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Lost state
  if (duelState === DUEL_STATE.LOST) {
    return (
      <div className="duel-overlay">
        <div className="duel-modal">
          <div className="duel-result lose">
            <div className="result-icon">😔</div>
            <h2>You Lost</h2>
            <p className="result-text">
              {opponent?.username || 'Opponent'} was faster!
            </p>
            <div className="result-buttons">
              <button className="duel-btn primary" onClick={handlePlayAgain}>
                Play Again
              </button>
              <button className="duel-btn secondary" onClick={handleExit}>
                Exit
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default memo(DuelMode)
