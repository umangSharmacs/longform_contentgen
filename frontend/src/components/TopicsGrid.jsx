import React from 'react'
import TopicCard from './TopicCard'
import './TopicsGrid.css'

function TopicsGrid({ topics, onUpdateTopic, onDeleteTopic }) {
  if (!Array.isArray(topics) || topics.length === 0) {
    return (
      <div className="topics-empty">
        <p>No topics available. Please wait for processing to complete.</p>
      </div>
    )
  }

  return (
    <div className="topics-grid">
      {topics.map((topic, index) => (
        <TopicCard
          key={index}
          topic={topic}
          index={index}
          onUpdate={onUpdateTopic}
          onDelete={onDeleteTopic}
        />
      ))}
    </div>
  )
}

export default TopicsGrid
