import React, { useState } from 'react'
import TopicsGrid from './TopicsGrid'
import './TopicsPhase.css'

function TopicsPhase({ topics, runId, onBack, onProceed }) {
  const [currentTopics, setCurrentTopics] = useState(topics || [])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleUpdateTopic = (index, updatedTopic) => {
    setCurrentTopics(prev => {
      const newTopics = [...prev]
      newTopics[index] = updatedTopic
      return newTopics
    })
  }

  const handleDeleteTopic = (index) => {
    setCurrentTopics(prev => prev.filter((_, i) => i !== index))
  }

  const handleAddTopic = () => {
    const newTopic = {
      topic_name: "New Topic",
      description: "Enter topic description here..."
    }
    setCurrentTopics(prev => [...prev, newTopic])
  }

  const handleResetTopics = () => {
    if (window.confirm('Are you sure you want to reset all topics to their original state? This will undo all your changes.')) {
      setCurrentTopics(topics || [])
    }
  }

  const handleProceedToNext = async () => {
    if (currentTopics.length === 0) {
      alert('Please add at least one topic before proceeding.')
      return
    }

    setIsSubmitting(true)
    
    try {
      const nonce = window.nslfg_ajax?.nonce
      if (!nonce) {
        alert('Security token not available. Please refresh the page.')
        return
      }

      // Send topics to WordPress backend
      const response = await fetch('/wp-admin/admin-ajax.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'deep-research-longformgen',
          nonce: nonce,
          run_id: runId || '',
          topics: JSON.stringify(currentTopics)
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        console.log('Topics sent successfully:', data.data)
        // Call the onProceed callback to move to next phase
        if (onProceed) {
          onProceed(currentTopics, data.data)
        }
      } else {
        alert('Failed to send topics: ' + (data.data || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error sending topics:', error)
      alert('Failed to send topics. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="topics-phase">
      <div className="topics-header">
        <div className="topics-title">
          <h2>Review and Edit Topics</h2>
          <p>Review the generated topics and make any necessary edits before proceeding</p>
        </div>
        
        <div className="topics-controls">
          <button 
            onClick={handleAddTopic}
            className="control-button add-topic"
          >
            + Add Topic
          </button>
          <button 
            onClick={handleResetTopics}
            className="control-button reset-button"
          >
            Reset Topics
          </button>
          <button 
            onClick={onBack}
            className="control-button back-button"
          >
            Back to Selection
          </button>
        </div>
      </div>

      <div className="topics-stats">
        <span className="total-topics">Total Topics: {currentTopics.length}</span>
        <span className="editable-note">All topics are editable - click the edit button to modify</span>
      </div>

      <div className="topics-section">
        <TopicsGrid 
          topics={currentTopics}
          onUpdateTopic={handleUpdateTopic}
          onDeleteTopic={handleDeleteTopic}
        />
      </div>

      <div className="topics-footer">
        <button 
          onClick={handleProceedToNext}
          disabled={isSubmitting || currentTopics.length === 0}
          className="proceed-button"
        >
          {isSubmitting ? 'Processing...' : `Proceed with ${currentTopics.length} Topics`}
        </button>
      </div>
    </div>
  )
}

export default TopicsPhase
