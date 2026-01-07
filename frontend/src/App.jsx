import { useCallback, useState, useEffect } from 'react'
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
    const result = handleCellClick(row, col)

    if (result.action === 'reveal') {
      hapticFeedback('light')
    } else if (result.action === 'lost') {
      hapticFeedback('error')
    } else if (result.action === 'won') {
      hapticFeedback('success')
    }
  }, [handleCellClick, hapticFeedback])

  const onCellRightClick = useCallback((row, col) => {
    const result = handleCellRightClick(row, col)

    if (result.action === 'flag' || result.action === 'unflag') {
      hapticFeedback('medium')
    }
  }, [handleCellRightClick, hapticFeedback])

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
          onCellRightClick={onCellRightClick}
          disabled={isGameOver}
        />

        <p className="hint">
          Tap to reveal • Long press to flag
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
