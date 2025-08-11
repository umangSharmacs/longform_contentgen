import React, { useState } from 'react'
import './TopicCard.css'

function TopicCard({ topic, index, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTopic, setEditedTopic] = useState({
    topic_name: topic.topic_name,
    description: topic.description
  })

  const handleSave = () => {
    onUpdate(index, editedTopic)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedTopic({
      topic_name: topic.topic_name,
      description: topic.description
    })
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this topic?')) {
      onDelete(index)
    }
  }

  return (
    <div className="topic-card">
      <div className="topic-header">
        <div className="topic-number">Topic {index + 1}</div>
        <div className="topic-actions">
          {!isEditing ? (
            <>
              <button 
                onClick={() => setIsEditing(true)}
                className="action-button edit-button"
                title="Edit topic"
              >
                ✏️
              </button>
              <button 
                onClick={handleDelete}
                className="action-button delete-button"
                title="Delete topic"
              >
                🗑️
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={handleSave}
                className="action-button save-button"
                title="Save changes"
              >
                ✅
              </button>
              <button 
                onClick={handleCancel}
                className="action-button cancel-button"
                title="Cancel editing"
              >
                ❌
              </button>
            </>
          )}
        </div>
      </div>

      <div className="topic-content">
        {isEditing ? (
          <div className="edit-form">
            <div className="form-group">
              <label htmlFor={`topic-name-${index}`}>Topic Name</label>
              <input
                type="text"
                id={`topic-name-${index}`}
                value={editedTopic.topic_name}
                onChange={(e) => setEditedTopic(prev => ({
                  ...prev,
                  topic_name: e.target.value
                }))}
                className="topic-name-input"
                placeholder="Enter topic name"
              />
            </div>
            <div className="form-group">
              <label htmlFor={`topic-description-${index}`}>Description</label>
              <textarea
                id={`topic-description-${index}`}
                value={editedTopic.description}
                onChange={(e) => setEditedTopic(prev => ({
                  ...prev,
                  description: e.target.value
                }))}
                className="topic-description-input"
                placeholder="Enter topic description"
                rows="4"
              />
            </div>
          </div>
        ) : (
          <>
            <h3 className="topic-title">{topic.topic_name}</h3>
            <p className="topic-description">{topic.description}</p>
          </>
        )}
      </div>
    </div>
  )
}

export default TopicCard
