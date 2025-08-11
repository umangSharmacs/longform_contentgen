import React, { useState } from 'react'
import './ResearchCard.css'

function ResearchCard({ item, onSelect, isSelected = false }) {
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false)
  const [showAbstract, setShowAbstract] = useState(false)

  const handleCardClick = (e) => {
    // Don't trigger selection when clicking on expand buttons
    if (e.target.closest('.expand-button') || e.target.closest('.abstract-toggle')) {
      return
    }
    
    if (onSelect) {
      onSelect(item)
    }
  }

  const toggleSummary = (e) => {
    e.stopPropagation()
    setIsSummaryExpanded(!isSummaryExpanded)
  }

  const toggleAbstract = (e) => {
    e.stopPropagation()
    setShowAbstract(!showAbstract)
  }

  const getSummaryText = () => {
    if (isSummaryExpanded) {
      return item.Summary
    }
    // Show approximately 2 lines (around 120 characters)
    return item.Summary.length > 120 
      ? `${item.Summary.substring(0, 120)}...` 
      : item.Summary
  }

  return (
    <div 
      className={`research-card ${isSelected ? 'selected' : ''}`}
      onClick={handleCardClick}
    >
      <div className="card-header">
        <div className="card-title">
          <span className="journal">{item.Journal}</span>
          <span className="score">Score: {item.Score}</span>
        </div>
        <div className="card-meta">
          <span className="date">{item.Date}</span>
          <span className="cancer-type">{item.CancerType}</span>
        </div>
      </div>
      
      <div className="card-content">
        <div className="identifiers">
          <span className="pmid">PMID: {item.PMID}</span>
          <span className="doi">DOI: {item.DOI}</span>
        </div>
        
        <div className="summary-section">
          <div className="summary">
            {getSummaryText()}
          </div>
          {item.Summary.length > 120 && (
            <button 
              className="expand-button"
              onClick={toggleSummary}
            >
              {isSummaryExpanded ? 'Show Less' : 'Show More'}
            </button>
          )}
        </div>

        {showAbstract && item.Abstract && (
          <div className="abstract-section">
            <h4>Abstract</h4>
            <div className="abstract">
              {item.Abstract}
            </div>
          </div>
        )}
        
        <div className="card-footer">
          <span className={`status ${item.Used ? 'used' : 'unused'}`}>
            {item.Used ? 'Used' : 'Unused'}
          </span>
          <div className="card-actions">
            {item.Abstract && (
              <button 
                className="abstract-toggle"
                onClick={toggleAbstract}
              >
                {showAbstract ? 'Hide Abstract' : 'Show Abstract'}
              </button>
            )}
            {onSelect && (
              <span className="selection-indicator">
                {isSelected ? '✓ Selected' : 'Click to select'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResearchCard
