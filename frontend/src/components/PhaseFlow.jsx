import React from 'react'
import './PhaseFlow.css'

function PhaseFlow({ currentPhase, onNavigateBack, onNavigateForward, canGoBack, canGoForward }) {
  const phases = [
    { id: 'search', label: 'Search', description: 'Fetch Data' },
    { id: 'selection', label: 'Selection', description: 'Choose Items' },
    { id: 'topics', label: 'Topics', description: 'Review & Edit' },
    { id: 'processing', label: 'Processing', description: 'Generate Content' },
    { id: 'review', label: 'Review', description: 'Final Review' }
  ]

  const getCurrentPhaseIndex = () => {
    return phases.findIndex(phase => phase.id === currentPhase)
  }

  const currentIndex = getCurrentPhaseIndex()

  return (
    <div className="phase-flow">
      <div className="phase-flow-container">
        <button 
          className={`nav-button nav-back ${!canGoBack ? 'disabled' : ''}`}
          onClick={onNavigateBack}
          disabled={!canGoBack}
          title="Go to previous phase"
        >
          <span className="nav-arrow">←</span>
        </button>
        
        {phases.map((phase, index) => {
          const isActive = phase.id === currentPhase
          const isCompleted = index < currentIndex
          const isUpcoming = index > currentIndex
          
          return (
            <div 
              key={phase.id} 
              className={`phase-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isUpcoming ? 'upcoming' : ''}`}
            >
              <div className="phase-number">
                {isCompleted ? (
                  <span className="checkmark">✓</span>
                ) : (
                  <span className="number">{index + 1}</span>
                )}
              </div>
              <div className="phase-content">
                <div className="phase-label">{phase.label}</div>
                <div className="phase-description">{phase.description}</div>
              </div>
              {index < phases.length - 1 && (
                <div className="phase-connector"></div>
              )}
            </div>
          )
        })}
        
        <button 
          className={`nav-button nav-forward ${!canGoForward ? 'disabled' : ''}`}
          onClick={onNavigateForward}
          disabled={!canGoForward}
          title="Go to next phase"
        >
          <span className="nav-arrow">→</span>
        </button>
      </div>
    </div>
  )
}

export default PhaseFlow
