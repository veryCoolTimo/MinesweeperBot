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
    clickedCell,
    showingIndex,
    gridSize,
    sequenceLength,
    userSequence,
    startGame,
    handleCellClick
  } = useMemoryGame('easy')

  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    if (gameState === GAME_STATE.LOST) {
      setTimeout(() => {
        hapticFeedback('error')
        setShowResult(true)
      }, 400)
    }
  }, [gameState, hapticFeedback])

  const onCellClick = useCallback((cellIndex) => {
    const result = handleCellClick(cellIndex)
    if (!result) return

    if (result.action === 'correct') {
      hapticFeedback('light')
    } else if (result.action === 'levelUp') {
      hapticFeedback('success')
    } else if (result.action === 'wrong') {
      hapticFeedback('error')
    }
  }, [handleCellClick, hapticFeedback])

  const onStartGame = useCallback((diff) => {
    hapticFeedback('medium')
    setShowResult(false)
    startGame(diff)
  }, [startGame, hapticFeedback])

  const isShowingSequence = gameState === GAME_STATE.SHOWING
  const isInputMode = gameState === GAME_STATE.INPUT
  const progress = sequenceLength > 0 ? Math.round((userSequence.length / sequenceLength) * 100) : 0

  return (
    <div className="memory-app">
      {/* Header */}
      <header className="memory-header">
        <div className="header-content">
          <h1>Memory</h1>
          {gameState !== GAME_STATE.IDLE && (
            <div className="stats-pills">
              <div className="pill">
                <span className="pill-value">{level}</span>
                <span className="pill-label">Level</span>
              </div>
              <div className="pill accent">
                <span className="pill-value">{score}</span>
                <span className="pill-label">Score</span>
              </div>
              <div className="pill">
                <span className="pill-value">{highScore}</span>
                <span className="pill-label">Best</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="memory-main">
        {gameState === GAME_STATE.IDLE ? (
          <div className="start-screen">
            <div className="logo-container">
              <div className="logo-icon">🧠</div>
              <p className="tagline">Test your memory</p>
            </div>

            <div className="difficulty-buttons">
              {Object.entries(DIFFICULTIES).map(([key, config]) => (
                <button
                  key={key}
                  className={`difficulty-btn ${key}`}
                  onClick={() => onStartGame(key)}
                >
                  <span className="diff-name">{config.name}</span>
                  <span className="diff-desc">{config.gridSize}×{config.gridSize} • Start with {config.startLength}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="game-container">
            {/* Status */}
            <div className="game-status">
              {isShowingSequence && (
                <div className="status-badge watching">
                  <span className="status-dot"></span>
                  Watch carefully
                </div>
              )}
              {isInputMode && (
                <div className="status-badge playing">
                  <span className="status-dot"></span>
                  Your turn
                </div>
              )}
            </div>

            {/* Board */}
            <MemoryBoard
              gridSize={gridSize}
              activeCell={activeCell}
              clickedCell={clickedCell}
              showingIndex={showingIndex}
              sequence={sequence}
              isInput={isInputMode}
              disabled={!isInputMode}
              onCellClick={onCellClick}
            />

            {/* Progress */}
            {isInputMode && (
              <div className="progress-container">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span className="progress-text">{userSequence.length} / {sequenceLength}</span>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Result Modal */}
      {showResult && (
        <div className="modal-overlay" onClick={() => setShowResult(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-emoji">😔</div>
            <h2>Game Over</h2>

            <div className="result-cards">
              <div className="result-card">
                <span className="result-value">{level}</span>
                <span className="result-label">Level</span>
              </div>
              <div className="result-card primary">
                <span className="result-value">{score}</span>
                <span className="result-label">Score</span>
              </div>
            </div>

            {score > 0 && score >= highScore && (
              <div className="new-record">
                <span>🏆</span> New High Score!
              </div>
            )}

            <div className="modal-buttons">
              <button className="btn primary" onClick={() => onStartGame(difficulty)}>
                Try Again
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
