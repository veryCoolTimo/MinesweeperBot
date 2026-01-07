import { useCallback, useState, useEffect, useRef } from 'react'
import Header from './components/Header'
import Board from './components/Board'
import GameOverModal from './components/GameOverModal'
import { useGame, GAME_STATE } from './hooks/useGame'
import { useTelegram } from './hooks/useTelegram'
import './App.css'

function App() {
  const { hapticFeedback, sendData, user } = useTelegram()
  const {
    board,
    gameState,
    difficulty,
    time,
    flagCount,
    mineCount,
    startNewGame,
    handleCellClick,
    handleCellRightClick
  } = useGame('easy')

  const [showModal, setShowModal] = useState(false)
  const [flagMode, setFlagMode] = useState(false)
  const lastTapRef = useRef(0)
  const doubleTapDelay = 300 // ms

  // Reset flag mode on new game
  useEffect(() => {
    if (gameState === GAME_STATE.IDLE) {
      setFlagMode(false)
    }
  }, [gameState])

  // Show modal on game end
  useEffect(() => {
    if (gameState === GAME_STATE.WON || gameState === GAME_STATE.LOST) {
      // Delay modal slightly for better UX
      const timer = setTimeout(() => {
        setShowModal(true)
        hapticFeedback(gameState === GAME_STATE.WON ? 'success' : 'error')

        // Send result to bot if won
        if (gameState === GAME_STATE.WON) {
          sendData({
            action: 'game_won',
            difficulty,
            time: time * 1000,
            user_id: user?.id
          })
        }
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [gameState, difficulty, time, user, hapticFeedback, sendData])

  const onCellClick = useCallback((row, col) => {
    const now = Date.now()
    const timeSinceLastTap = now - lastTapRef.current
    lastTapRef.current = now

    // Double tap toggles flag mode
    if (timeSinceLastTap < doubleTapDelay) {
      hapticFeedback('medium')
      setFlagMode(prev => !prev)
      return
    }

    // If flag mode is on, place flag instead of revealing
    if (flagMode) {
      const result = handleCellRightClick(row, col)
      if (result.action === 'flag' || result.action === 'unflag') {
        hapticFeedback('medium')
      }
      return
    }

    const result = handleCellClick(row, col)

    if (result.action === 'reveal' || result.action === 'chord') {
      hapticFeedback('light')
    } else if (result.action === 'lost') {
      hapticFeedback('error')
    } else if (result.action === 'won') {
      hapticFeedback('success')
    }
  }, [handleCellClick, handleCellRightClick, hapticFeedback, flagMode])

  const toggleFlagMode = useCallback(() => {
    hapticFeedback('light')
    setFlagMode(prev => !prev)
  }, [hapticFeedback])

  const onDifficultyChange = useCallback((newDifficulty) => {
    hapticFeedback('light')
    startNewGame(newDifficulty)
    setShowModal(false)
  }, [startNewGame, hapticFeedback])

  const onNewGame = useCallback(() => {
    hapticFeedback('medium')
    startNewGame()
    setShowModal(false)
  }, [startNewGame, hapticFeedback])

  const isGameOver = gameState === GAME_STATE.WON || gameState === GAME_STATE.LOST

  return (
    <div className="app">
      <Header
        time={time}
        flagCount={flagCount}
        mineCount={mineCount}
        difficulty={difficulty}
        gameState={gameState}
        onDifficultyChange={onDifficultyChange}
        onNewGame={onNewGame}
      />

      <main className="game-area">
        <Board
          board={board}
          onCellClick={onCellClick}
          disabled={isGameOver}
        />

        <div className="controls">
          <button
            className={`flag-toggle ${flagMode ? 'active' : ''}`}
            onClick={toggleFlagMode}
          >
            <span className="flag-icon">🚩</span>
            <span className="flag-label">{flagMode ? 'Flag ON' : 'Flag OFF'}</span>
          </button>
        </div>

        <p className="hint">
          {flagMode ? 'Tap to flag • Double tap to switch' : 'Tap to reveal • Double tap for flag mode'}
        </p>
      </main>

      <GameOverModal
        isOpen={showModal}
        isWin={gameState === GAME_STATE.WON}
        time={time}
        onNewGame={onNewGame}
        onClose={() => setShowModal(false)}
      />
    </div>
  )
}

export default App
