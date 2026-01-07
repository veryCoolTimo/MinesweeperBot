import { memo, useState } from 'react'
import './Tutorial.css'

const STEPS = [
  {
    title: 'Welcome to Minesweeper!',
    content: 'The goal is to reveal all cells without hitting a mine. Let\'s learn how to play!',
    image: '🎮'
  },
  {
    title: 'Numbers',
    content: 'Each number shows how many mines are in the 8 surrounding cells. Use this to deduce where mines are.',
    image: '🔢',
    example: [
      [null, null, null],
      [null, '2', null],
      [null, null, null]
    ]
  },
  {
    title: 'Flags',
    content: 'When you\'re sure a cell contains a mine, place a flag! Double-tap to toggle flag mode, then tap cells to flag them.',
    image: '🚩'
  },
  {
    title: 'Chord',
    content: 'If you tap on a revealed number and have flagged the correct number of mines around it, all safe neighbors will open automatically!',
    image: '⚡'
  },
  {
    title: 'First Click is Safe',
    content: 'Your first click will never be a mine. The area around it will also be safe, giving you a good start.',
    image: '✨'
  },
  {
    title: 'Tips',
    content: 'Start from corners and edges — they have fewer neighbors, making them easier to solve. Look for patterns!',
    image: '💡'
  },
  {
    title: 'You\'re Ready!',
    content: 'Good luck! Remember: every board is solvable without guessing. Use logic, not luck!',
    image: '🏆'
  }
]

function Tutorial({ onComplete }) {
  const [step, setStep] = useState(0)
  const currentStep = STEPS[step]
  const isLast = step === STEPS.length - 1

  const handleNext = () => {
    if (isLast) {
      onComplete()
    } else {
      setStep(s => s + 1)
    }
  }

  const handlePrev = () => {
    if (step > 0) {
      setStep(s => s - 1)
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-modal">
        <div className="tutorial-progress">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`tutorial-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
            />
          ))}
        </div>

        <div className="tutorial-icon">{currentStep.image}</div>

        <h2 className="tutorial-title">{currentStep.title}</h2>
        <p className="tutorial-content">{currentStep.content}</p>

        {currentStep.example && (
          <div className="tutorial-example">
            {currentStep.example.map((row, i) => (
              <div key={i} className="tutorial-row">
                {row.map((cell, j) => (
                  <div key={j} className={`tutorial-cell ${cell ? 'revealed' : ''}`}>
                    {cell}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        <div className="tutorial-buttons">
          {step > 0 ? (
            <button className="tutorial-btn secondary" onClick={handlePrev}>
              Back
            </button>
          ) : (
            <button className="tutorial-btn secondary" onClick={handleSkip}>
              Skip
            </button>
          )}
          <button className="tutorial-btn primary" onClick={handleNext}>
            {isLast ? 'Start Playing!' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default memo(Tutorial)
