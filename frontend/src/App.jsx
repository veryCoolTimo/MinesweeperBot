import { useCallback, useState, useEffect, useRef } from 'react'
import Header from './components/Header'
import Board from './components/Board'
import GameOverModal from './components/GameOverModal'
import ModeSelector from './components/ModeSelector'
import StatsModal from './components/StatsModal'
import Tutorial from './components/Tutorial'
import TimedOverlay from './components/TimedOverlay'
import { useGame, GAME_STATE } from './hooks/useGame'
import { useTelegram } from './hooks/useTelegram'
import { useStats } from './hooks/useStats'
import './App.css'

const TIMED_DURATION = 180 // 3 minutes

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

  const {
    stats,
    recordWin,
    recordLoss,
    recordTimedSession,
    completeTutorial,
    resetStats
  } = useStats()

  const [showModal, setShowModal] = useState(false)
  const [flagMode, setFlagMode] = useState(false)
  const [gameMode, setGameMode] = useState('classic')
  const [showModeSelector, setShowModeSelector] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)

  // Timed mode state
  const [timedTimeLeft, setTimedTimeLeft] = useState(TIMED_DURATION)
  const [timedWins, setTimedWins] = useState(0)
  const [timedActive, setTimedActive] = useState(false)
  const timedRef = useRef(null)

  const lastTapRef = useRef(0)
  const doubleTapDelay = 300

  // Show tutorial on first launch
  useEffect(() => {
    if (!stats.tutorialCompleted) {
      setShowTutorial(true)
    }
  }, [stats.tutorialCompleted])

  // Reset flag mode on new game
  useEffect(() => {
    if (gameState === GAME_STATE.IDLE) {
      setFlagMode(false)
    }
  }, [gameState])

  // Timed mode timer
  useEffect(() => {
    if (gameMode === 'timed' && timedActive && timedTimeLeft > 0) {
      timedRef.current = setInterval(() => {
        setTimedTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timedRef.current)
            setTimedActive(false)
            recordTimedSession(difficulty, timedWins)
            setShowModal(true)
            return 0
          }
          return t - 1
        })
      }, 1000)

      return () => clearInterval(timedRef.current)
    }
  }, [gameMode, timedActive, timedTimeLeft, difficulty, timedWins, recordTimedSession])

  // Handle game end - record stats
  useEffect(() => {
    if (gameState === GAME_STATE.WON || gameState === GAME_STATE.LOST) {
      const timer = setTimeout(() => {
        hapticFeedback(gameState === GAME_STATE.WON ? 'success' : 'error')

        if (gameMode === 'timed') {
          if (gameState === GAME_STATE.WON) {
            setTimedWins(w => w + 1)
            // Auto start new game in timed mode
            startNewGame()
          } else {
            // Lost in timed mode - just start new game
            startNewGame()
          }
        } else {
          // Classic or No Flags mode
          if (gameState === GAME_STATE.WON) {
            recordWin(gameMode, difficulty, time)
            sendData({
              action: 'game_won',
              difficulty,
              time: time * 1000,
              mode: gameMode,
              user_id: user?.id
            })
          } else {
            recordLoss(gameMode, difficulty)
          }
          setShowModal(true)
        }
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [gameState, gameMode, difficulty, time, user, hapticFeedback, sendData, recordWin, recordLoss, startNewGame])

  const onCellClick = useCallback((row, col) => {
    const now = Date.now()
    const timeSinceLastTap = now - lastTapRef.current
    lastTapRef.current = now

    // Double tap toggles flag mode (only in modes that allow flags)
    if (timeSinceLastTap < doubleTapDelay && gameMode !== 'noflags') {
      hapticFeedback('medium')
      setFlagMode(prev => !prev)
      return
    }

    // In No Flags mode, only reveal
    if (gameMode === 'noflags') {
      const result = handleCellClick(row, col)
      if (result.action === 'reveal' || result.action === 'chord') {
        hapticFeedback('light')
      } else if (result.action === 'lost') {
        hapticFeedback('error')
      } else if (result.action === 'won') {
        hapticFeedback('success')
      }
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
  }, [handleCellClick, handleCellRightClick, hapticFeedback, flagMode, gameMode])

  const toggleFlagMode = useCallback(() => {
    if (gameMode === 'noflags') return
    hapticFeedback('light')
    setFlagMode(prev => !prev)
  }, [hapticFeedback, gameMode])

  const onDifficultyChange = useCallback((newDifficulty) => {
    hapticFeedback('light')
    startNewGame(newDifficulty)
    setShowModal(false)
    setFlagMode(false)

    // Reset timed mode if active
    if (gameMode === 'timed') {
      setTimedTimeLeft(TIMED_DURATION)
      setTimedWins(0)
      setTimedActive(false)
    }
  }, [startNewGame, hapticFeedback, gameMode])

  const onNewGame = useCallback(() => {
    hapticFeedback('medium')
    startNewGame()
    setShowModal(false)
    setFlagMode(false)

    // Start timed mode
    if (gameMode === 'timed' && !timedActive) {
      setTimedTimeLeft(TIMED_DURATION)
      setTimedWins(0)
      setTimedActive(true)
    }
  }, [startNewGame, hapticFeedback, gameMode, timedActive])

  const onModeChange = useCallback((mode) => {
    if (mode === 'tutorial') {
      setShowTutorial(true)
      setShowModeSelector(false)
      return
    }

    setGameMode(mode)
    setShowModeSelector(false)
    setFlagMode(false)
    startNewGame()

    // Reset timed state
    setTimedTimeLeft(TIMED_DURATION)
    setTimedWins(0)
    setTimedActive(false)

    hapticFeedback('light')
  }, [startNewGame, hapticFeedback])

  const onTutorialComplete = useCallback(() => {
    completeTutorial()
    setShowTutorial(false)
    hapticFeedback('success')
  }, [completeTutorial, hapticFeedback])

  const isGameOver = gameState === GAME_STATE.WON || gameState === GAME_STATE.LOST
  const showNoFlagsMode = gameMode === 'noflags'

  return (
    <div className="app">
      {/* Timed mode overlay */}
      {gameMode === 'timed' && timedActive && (
        <TimedOverlay
          timeLeft={timedTimeLeft}
          wins={timedWins}
        />
      )}

      <Header
        time={time}
        flagCount={flagCount}
        mineCount={mineCount}
        difficulty={difficulty}
        gameState={gameState}
        gameMode={gameMode}
        streak={stats.currentStreak}
        onDifficultyChange={onDifficultyChange}
        onNewGame={onNewGame}
        onModeClick={() => setShowModeSelector(true)}
        onStatsClick={() => setShowStats(true)}
      />

      <main className={`game-area ${gameMode === 'timed' && timedActive ? 'timed-active' : ''}`}>
        <Board
          board={board}
          onCellClick={onCellClick}
          disabled={isGameOver && gameMode !== 'timed'}
        />

        {!showNoFlagsMode && (
          <div className="controls">
            <button
              className={`flag-toggle ${flagMode ? 'active' : ''}`}
              onClick={toggleFlagMode}
            >
              <span className="flag-icon">🚩</span>
              <span className="flag-label">{flagMode ? 'Flag ON' : 'Flag OFF'}</span>
            </button>
          </div>
        )}

        <p className="hint">
          {showNoFlagsMode
            ? 'Tap to reveal • No flags allowed!'
            : flagMode
              ? 'Tap to flag • Double tap to switch'
              : 'Tap to reveal • Double tap for flag mode'
          }
        </p>
      </main>

      {/* Game Over Modal */}
      {showModal && gameMode !== 'timed' && (
        <GameOverModal
          isOpen={showModal}
          isWin={gameState === GAME_STATE.WON}
          time={time}
          onNewGame={onNewGame}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Timed Mode End Modal */}
      {showModal && gameMode === 'timed' && timedTimeLeft === 0 && (
        <GameOverModal
          isOpen={true}
          isWin={true}
          time={timedWins}
          isTimed={true}
          onNewGame={() => {
            setShowModal(false)
            setTimedTimeLeft(TIMED_DURATION)
            setTimedWins(0)
            setTimedActive(false)
            startNewGame()
          }}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Mode Selector */}
      {showModeSelector && (
        <ModeSelector
          currentMode={gameMode}
          onModeChange={onModeChange}
          onClose={() => setShowModeSelector(false)}
        />
      )}

      {/* Stats Modal */}
      {showStats && (
        <StatsModal
          stats={stats}
          onClose={() => setShowStats(false)}
          onReset={() => {
            resetStats()
            hapticFeedback('warning')
          }}
        />
      )}

      {/* Tutorial */}
      {showTutorial && (
        <Tutorial onComplete={onTutorialComplete} />
      )}
    </div>
  )
}

export default App
