import { useCallback, useState, useEffect } from 'react'
import MemoryBoard from './components/MemoryBoard'
import { useMemoryGame, GAME_STATE, DIFFICULTIES } from './hooks/useMemoryGame'
import { useTelegram } from '../../shared/hooks/useTelegram'
import './MemoryApp.css'

function MemoryApp() {
  const { hapticFeedback } = useTelegram()
  const {
    gameState,
    difficulty,
    level,
    score,
    highScore,
    sequence,
    activeCell,
    showingIndex,
    gridSize,
    sequenceLength,
    startGame,
    handleCellClick
  } = useMemoryGame('easy')

  const [showResult, setShowResult] = useState(false)
  const [lastClickResult, setLastClickResult] = useState(null)

  // Handle game end
  useEffect(() => {
    if (gameState === GAME_STATE.WON || gameState === GAME_STATE.LOST) {
      setTimeout(() => {
        hapticFeedback(gameState === GAME_STATE.WON ? 'success' : 'error')
        setShowResult(true)
      }, 300)
    }
  }, [gameState, hapticFeedback])

  const onCellClick = useCallback((cellIndex) => {
    const result = handleCellClick(cellIndex)
    if (!result) return

    setLastClickResult(result)

    if (result.action === 'correct') {
      hapticFeedback('light')
    } else if (result.action === 'levelUp') {
      hapticFeedback('success')
    } else if (result.action === 'wrong') {
      hapticFeedback('error')
    } else if (result.action === 'won') {
      hapticFeedback('success')
    }
  }, [handleCellClick, hapticFeedback])

  const onStartGame = useCallback((diff) => {
    hapticFeedback('medium')
    setShowResult(false)
    setLastClickResult(null)
    startGame(diff)
  }, [startGame, hapticFeedback])

  const isShowingSequence = gameState === GAME_STATE.SHOWING
  const isInputMode = gameState === GAME_STATE.INPUT
  const isGameOver = gameState === GAME_STATE.WON || gameState === GAME_STATE.LOST

  return (
    <div className="memory-app">
      <header className="memory-header">
        <h1>🧠 Memory</h1>
        <div className="stats-row">
          <div className="stat">
            <span className="stat-label">Level</span>
            <span className="stat-value">{level}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Score</span>
            <span className="stat-value">{score}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Best</span>
            <span className="stat-value">{highScore}</span>
          </div>
        </div>
      </header>

      <main className="memory-main">
        {gameState === GAME_STATE.IDLE ? (
          <div className="start-screen">
            <h2>Select Difficulty</h2>
            <div className="difficulty-buttons">
              {Object.entries(DIFFICULTIES).map(([key, config]) => (
                <button
                  key={key}
                  className={`difficulty-btn ${key}`}
                  onClick={() => onStartGame(key)}
                >
                  <span className="diff-name">{config.name}</span>
                  <span className="diff-info">{config.gridSize}×{config.gridSize} grid</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="game-status">
              {isShowingSequence && (
                <p className="status-text showing">
                  Watch carefully! ({showingIndex + 1}/{sequenceLength})
                </p>
              )}
              {isInputMode && (
                <p className="status-text input">
                  Your turn! Tap the sequence
                </p>
              )}
            </div>

            <MemoryBoard
              gridSize={gridSize}
              activeCell={activeCell}
              showingIndex={showingIndex}
              sequence={sequence}
              isInput={isInputMode}
              disabled={!isInputMode}
              onCellClick={onCellClick}
            />

            {isInputMode && (
              <div className="progress-indicator">
                <span>Progress: {sequence.length > 0 ? `${Math.round((lastClickResult?.remaining !== undefined ? (sequenceLength - lastClickResult.remaining) : 0) / sequenceLength * 100)}%` : '0%'}</span>
              </div>
            )}
          </>
        )}
      </main>

      {/* Result Modal */}
      {showResult && (
        <div className="modal-overlay" onClick={() => setShowResult(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{gameState === GAME_STATE.WON ? '🎉 Amazing!' : '😢 Game Over'}</h2>
            <div className="result-stats">
              <div className="result-stat">
                <span>Level Reached</span>
                <strong>{level}</strong>
              </div>
              <div className="result-stat">
                <span>Final Score</span>
                <strong>{score}</strong>
              </div>
              {score >= highScore && score > 0 && (
                <p className="new-record">🏆 New High Score!</p>
              )}
            </div>
            <div className="modal-buttons">
              <button className="btn primary" onClick={() => onStartGame(difficulty)}>
                Play Again
              </button>
              <button className="btn secondary" onClick={() => {
                setShowResult(false)
                window.location.reload()
              }}>
                Change Difficulty
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MemoryApp
