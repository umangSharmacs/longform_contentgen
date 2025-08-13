import React, { useState, useEffect, useRef } from 'react'
import { createChat } from '@n8n/chat'
import '@n8n/chat/style.css'
import './ProcessingPhase.css'

function ProcessingPhase({ runId, onBack }) {
  const [processingStatus, setProcessingStatus] = useState('initializing')
  const [isInitialized, setIsInitialized] = useState(false)
  const [researchResults, setResearchResults] = useState(null)
  const [topics, setTopics] = useState([])
  const [isDeepResearchRunning, setIsDeepResearchRunning] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    topics: true,
    research: false
  })
  const [expandedResearchSections, setExpandedResearchSections] = useState({
    original: false,
    reworked: false,
    improved: false,
    reasons: false,
    'reasons-legacy': false
  })
  const [editingSections, setEditingSections] = useState({
    original: false,
    reworked: false,
    improved: false
  })
  const [editedContent, setEditedContent] = useState({
    original: '',
    reworked: '',
    improved: ''
  })
  const chatContainerRef = useRef(null)
  const chatInstanceRef = useRef(null)
  const eventSourceRef = useRef(null)

  useEffect(() => {
    // Initialize the processing phase
    initializeProcessing()
    
    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  const initializeProcessing = async () => {
    setProcessingStatus('initializing')
    
    try {
      const nonce = window.nslfg_ajax?.nonce
      if (!nonce) {
        throw new Error('Security token not available')
      }

      // Load topics first
      await loadTopics()

      // Initialize processing phase without sending n8n request
      console.log('Processing phase initialized successfully')
      setProcessingStatus('ready')
      setIsInitialized(true)
      
      // Initialize n8n chat immediately - it will handle its own toggle
      setTimeout(async () => {
        await initializeChat()
      }, 100)
    } catch (error) {
      console.error('Processing initialization error:', error)
      setProcessingStatus('error')
    }
  }

  const loadTopics = async () => {
    try {
      const nonce = window.nslfg_ajax?.nonce
      if (!nonce) {
        throw new Error('Security token not available')
      }

      const response = await fetch('/wp-admin/admin-ajax.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'get-run-context',
          run_id: runId,
          nonce: nonce
        })
      })

      const data = await response.json()
      
      if (data.success) {
        const topicsData = data.data.topics || []
        setTopics(topicsData)
        console.log('Loaded topics:', topicsData)
        console.log('Full response data:', data.data)
      } else {
        console.error('Failed to load topics:', data.data)
      }
    } catch (error) {
      console.error('Error loading topics:', error)
    }
  }

  const initializeChat = async () => {
    if (!chatContainerRef.current) return

    try {
      // First, get the chat webhook URL from WordPress
      const nonce = window.nslfg_ajax?.nonce
      if (!nonce) {
        throw new Error('Security token not available')
      }

      const response = await fetch('/wp-admin/admin-ajax.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'get-chat-webhook-url',
          nonce: nonce
        })
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.data || 'Failed to get chat webhook URL')
      }

      const webhookUrl = data.data.webhook_url
      
      if (!webhookUrl) {
        throw new Error('Chat webhook URL not configured')
      }

      console.log('Got chat webhook URL:', webhookUrl)

      // Get the selected items data (topics are already loaded)
      const contextResponse = await fetch('/wp-admin/admin-ajax.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'get-run-context',
          run_id: runId,
          nonce: nonce
        })
      })

      const contextData = await contextResponse.json()
      let selectedItems = []
      
      if (contextData.success) {
        selectedItems = contextData.data.selected_items || []
        console.log('Got selected items:', selectedItems)
      }
      
      // Initialize the n8n chat with the fetched webhook URL
      chatInstanceRef.current = createChat({
        webhookUrl: webhookUrl,
        webhookConfig: {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          }
        },
        target: chatContainerRef.current,
        mode: 'window',
        showWelcomeScreen: false,
        loadPreviousSession: false,
        initialMessages: [
          'Hi there! 👋',
          'I\'m your AI content generation assistant. I can help you create longform content based on your research data.',
          'What would you like to work on today?'
        ],
        i18n: {
          en: {
            title: 'AI Content Generation Assistant',
            subtitle: 'Generate and refine content based on your research data',
            footer: '',
            getStarted: 'New Conversation',
            inputPlaceholder: 'Type your message to the AI agent...',
          },
        },
        metadata: {
          run_id: runId,
          nonce: window.nslfg_ajax?.nonce,
          action: 'chat-message-longformgen',
          selected_items: selectedItems,
          topics: topics
        },
        enableStreaming: false,
      })

      console.log('n8n Chat initialized successfully')
    } catch (error) {
      console.error('Failed to initialize n8n chat:', error)
      setProcessingStatus('error')
    }
  }

  const startSimplePolling = () => {
    // Simple polling to check for results after n8n webhook updates the database
    const pollInterval = setInterval(async () => {
      try {
        const nonce = window.nslfg_ajax?.nonce
        if (!nonce) return

        const response = await fetch('/wp-admin/admin-ajax.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            action: 'check-research-status',
            run_id: runId,
            nonce: nonce
          })
        })

        const data = await response.json()
        
        if (data.success) {
          console.log('Checking research status:', data.data)
          
          if (data.data.status === 'completed' || (data.data.research_results && data.data.research_results.length > 0)) {
            // Research is ready!
            setResearchResults(data.data.research_results || [])
            setProcessingStatus('completed')
            setIsDeepResearchRunning(false)
            
            // Stop polling
            clearInterval(pollInterval)
            
            // Don't call onComplete - stay in Processing phase to view results
            // if (onComplete) {
            //   onComplete(data.data)
            // }
          } else if (data.data.status === 'failed') {
            // Research failed
            setProcessingStatus('error')
            setIsDeepResearchRunning(false)
            
            // Stop polling
            clearInterval(pollInterval)
            
            alert('Deep research failed. Please try again.')
          }
          // If status is still 'processing', continue polling
        }
      } catch (error) {
        console.error('Error checking research status:', error)
      }
    }, 5000) // Check every 5 seconds

    // Store interval reference for cleanup
    eventSourceRef.current = { close: () => clearInterval(pollInterval) }
  }

  const startDeepResearch = async () => {
    if (isDeepResearchRunning) return

    setIsDeepResearchRunning(true)
    
    try {
      const nonce = window.nslfg_ajax?.nonce
      if (!nonce) {
        alert('Security token not available. Please refresh the page.')
        return
      }

      // Prepare form data
      const formData = new FormData()
      formData.append('action', 'deepresearch-longformgen')
      formData.append('nonce', nonce)
      formData.append('run_id', runId)
      formData.append('topics', JSON.stringify(topics))

      // Send request to WordPress backend
      const response = await fetch('/wp-admin/admin-ajax.php', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (data.success) {
        console.log('Deep research started successfully:', data.data)
        // Start simple polling to check for results
        startSimplePolling()
        // Keep the button in "running" state
        setIsDeepResearchRunning(true)
      } else {
        alert('Failed to start deep research: ' + (data.data || 'Unknown error'))
        setIsDeepResearchRunning(false)
      }
    } catch (error) {
      console.error('Error starting deep research:', error)
      alert('Failed to start deep research. Please try again.')
      setIsDeepResearchRunning(false)
    }
  }

  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }))
  }

  const toggleResearchSection = (sectionName) => {
    setExpandedResearchSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }))
  }

  const toggleEditing = (sectionName) => {
    setEditingSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }))
    
    // Initialize edited content when starting to edit
    if (!editingSections[sectionName]) {
      const currentContent = researchResults?.[0]?.[`deepresearch_${sectionName}`] || 
                           researchResults?.[0]?.[`deepresearch_${sectionName === 'original' ? 'original' : sectionName === 'reworked' ? 'reworked' : 'improved_text'}`] || ''
      setEditedContent(prev => ({
        ...prev,
        [sectionName]: currentContent
      }))
    }
  }

  const saveEditedContent = async (sectionName) => {
    try {
      const nonce = window.nslfg_ajax?.nonce
      if (!nonce) {
        throw new Error('Security token not available')
      }

      const response = await fetch('/wp-admin/admin-ajax.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'save-edited-research',
          run_id: runId,
          section: sectionName,
          content: editedContent[sectionName],
          nonce: nonce
        })
      })

      const data = await response.json()
      
      if (data.success) {
        console.log('Edited content saved successfully')
        toggleEditing(sectionName)
        
        // Update the research results with edited content
        setResearchResults(prev => {
          if (prev && prev.length > 0) {
            const updated = [...prev]
            const fieldName = sectionName === 'original' ? 'deepresearch_original' : 
                            sectionName === 'reworked' ? 'deepresearch_reworked' : 'deepresearch_improved_text'
            updated[0] = { ...updated[0], [fieldName]: editedContent[sectionName] }
            return updated
          }
          return prev
        })
      } else {
        alert('Failed to save edited content: ' + (data.data || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error saving edited content:', error)
      alert('Failed to save edited content. Please try again.')
    }
  }

  const cancelEditing = (sectionName) => {
    setEditingSections(prev => ({
      ...prev,
      [sectionName]: false
    }))
    // Reset edited content to original
    const originalContent = researchResults?.[0]?.[`deepresearch_${sectionName}`] || 
                          researchResults?.[0]?.[`deepresearch_${sectionName === 'original' ? 'original' : sectionName === 'reworked' ? 'reworked' : 'improved_text'}`] || ''
    setEditedContent(prev => ({
      ...prev,
      [sectionName]: originalContent
    }))
  }

  // n8n will handle the chat toggle functionality

  const getStatusText = () => {
    switch (processingStatus) {
      case 'initializing':
        return 'Initializing AI Agent...'
      case 'ready':
        return 'AI Agent Ready'
      case 'processing':
        return 'Processing...'
      case 'completed':
        return 'Processing Complete'
      case 'error':
        return 'Error Occurred'
      default:
        return 'Unknown Status'
    }
  }

  if (processingStatus === 'error') {
    return (
      <div className="processing-phase">
        <div className="processing-header">
          <div className="status-indicator">
            <div className="status-dot error"></div>
            <span className="status-text">Error Occurred</span>
          </div>
          <button 
            className="back-button"
            onClick={onBack}
          >
            Back to Topics
          </button>
        </div>
        <div className="error-message">
          <p>Failed to initialize the AI agent. Please try again or contact support.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="processing-phase">
      <div className="processing-header">
        <div className="status-indicator">
          <div className={`status-dot ${processingStatus}`}></div>
          <span className="status-text">{getStatusText()}</span>
        </div>
        <button 
          className="back-button"
          onClick={onBack}
          disabled={processingStatus === 'initializing'}
        >
          Back to Topics
        </button>
      </div>

      {isInitialized && (
        <div className="processing-content">
          {/* Collapsible Topics Section */}
          <div className="collapsible-section">
            <div 
              className="section-header"
              onClick={() => toggleSection('topics')}
            >
              <div className="section-title">
                <span className="section-icon">📋</span>
                <h3>Selected Topics</h3>
                <span className="topic-count">({topics.length} topics)</span>
              </div>
              <div className={`expand-icon ${expandedSections.topics ? 'expanded' : ''}`}>
                ▼
              </div>
            </div>
            
            {expandedSections.topics && (
              <div className="section-content">
                <div className="topics-list">
                  {topics.length > 0 ? (
                    topics.map((topic, index) => (
                      <div key={index} className="topic-item">
                        <h4>{topic.topic_name}</h4>
                        <p>{topic.description}</p>
                      </div>
                    ))
                  ) : (
                    <p className="no-topics">No topics available</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Collapsible Deep Research Section */}
          <div className="collapsible-section">
            <div 
              className="section-header"
              onClick={() => toggleSection('research')}
            >
              <div className="section-title">
                <span className="section-icon">🔍</span>
                <h3>Deep Research</h3>
                {researchResults && (
                  <span className="research-status completed">Completed</span>
                )}
              </div>
              <div className={`expand-icon ${expandedSections.research ? 'expanded' : ''}`}>
                ▼
              </div>
            </div>
            
            {expandedSections.research && (
              <div className="section-content">
                <div className="research-controls">
                  <button
                    onClick={startDeepResearch}
                    disabled={isDeepResearchRunning}
                    className={`deep-research-button ${isDeepResearchRunning ? 'running' : ''}`}
                  >
                    {isDeepResearchRunning ? 'Research Running...' : 'Start Deep Research'}
                  </button>
                  
                  {researchResults && (
                    <div className="research-document">
                      <div className="document-header">
                        <h4>Research Document</h4>
                        <div className="document-meta">
                          <span className="document-date">{new Date().toLocaleDateString()}</span>
                          <span className="document-status">Completed</span>
                        </div>
                      </div>
                      <div className="document-content">
                        {Array.isArray(researchResults) ? (
                          researchResults.map((result, index) => (
                            <div key={index} className="document-section">
                              {/* Handle the new deep research format */}
                              {result.deepresearch_original && (
                                <div className="research-section">
                                  <div 
                                    className="research-header"
                                    onClick={() => toggleResearchSection('original')}
                                  >
                                    <h5 className="section-title">Deep Research Original</h5>
                                    <div className="header-controls">
                                      <button 
                                        className="edit-button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          toggleEditing('original')
                                        }}
                                        title="Edit content"
                                      >
                                        ✏️
                                      </button>
                                      <div className={`expand-icon ${expandedResearchSections.original ? 'expanded' : ''}`}>
                                        ▼
                                      </div>
                                    </div>
                                  </div>
                                  {expandedResearchSections.original && (
                                    <div className="research-content">
                                      {editingSections.original ? (
                                        <div className="editing-content">
                                          <textarea
                                            value={editedContent.original}
                                            onChange={(e) => setEditedContent(prev => ({ ...prev, original: e.target.value }))}
                                            className="edit-textarea"
                                            placeholder="Edit the research content..."
                                          />
                                          <div className="edit-controls">
                                            <button 
                                              className="save-button"
                                              onClick={() => saveEditedContent('original')}
                                            >
                                              Save
                                            </button>
                                            <button 
                                              className="cancel-button"
                                              onClick={() => cancelEditing('original')}
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="research-text" dangerouslySetInnerHTML={{ __html: result.deepresearch_original.replace(/\n/g, '<br/>') }} />
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {result.deepresearch_reworked && (
                                <div className="research-section">
                                  <div 
                                    className="research-header"
                                    onClick={() => toggleResearchSection('reworked')}
                                  >
                                    <h5 className="section-title">Deep Research Reworked</h5>
                                    <div className={`expand-icon ${expandedResearchSections.reworked ? 'expanded' : ''}`}>
                                      ▼
                                    </div>
                                  </div>
                                  {expandedResearchSections.reworked && (
                                    <div className="research-content">
                                      <div className="research-text" dangerouslySetInnerHTML={{ __html: result.deepresearch_reworked.replace(/\n/g, '<br/>') }} />
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {result.deepresearch_improved_text && (
                                <div className="research-section">
                                  <div 
                                    className="research-header"
                                    onClick={() => toggleResearchSection('improved')}
                                  >
                                    <h5 className="section-title">Deep Research Improved</h5>
                                    <div className="header-controls">
                                      <button 
                                        className="edit-button"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          toggleEditing('improved')
                                        }}
                                        title="Edit content"
                                      >
                                        ✏️
                                      </button>
                                      <div className={`expand-icon ${expandedResearchSections.improved ? 'expanded' : ''}`}>
                                        ▼
                                      </div>
                                    </div>
                                  </div>
                                  {expandedResearchSections.improved && (
                                    <div className="research-content">
                                      {editingSections.improved ? (
                                        <div className="editing-content">
                                          <textarea
                                            value={editedContent.improved}
                                            onChange={(e) => setEditedContent(prev => ({ ...prev, improved: e.target.value }))}
                                            className="edit-textarea"
                                            placeholder="Edit the research content..."
                                          />
                                          <div className="edit-controls">
                                            <button 
                                              className="save-button"
                                              onClick={() => saveEditedContent('improved')}
                                            >
                                              Save
                                            </button>
                                            <button 
                                              className="cancel-button"
                                              onClick={() => cancelEditing('improved')}
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="research-text" dangerouslySetInnerHTML={{ __html: result.deepresearch_improved_text.replace(/\n/g, '<br/>') }} />
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {result.reasons_for_change && (
                                <div className="research-section">
                                  <div 
                                    className="research-header"
                                    onClick={() => toggleResearchSection('reasons')}
                                  >
                                    <h5 className="section-title">Reasons for Change</h5>
                                    <div className={`expand-icon ${expandedResearchSections.reasons ? 'expanded' : ''}`}>
                                      ▼
                                    </div>
                                  </div>
                                  {expandedResearchSections.reasons && (
                                    <div className="research-content">
                                      <div className="reasons-list">
                                        {(() => {
                                          try {
                                            const reasons = JSON.parse(result.reasons_for_change);
                                            return Array.isArray(reasons) ? (
                                              <ul>
                                                {reasons.map((reason, reasonIndex) => (
                                                  <li key={reasonIndex}>{reason}</li>
                                                ))}
                                              </ul>
                                            ) : (
                                              <p>{result.reasons_for_change}</p>
                                            );
                                          } catch {
                                            return <p>{result.reasons_for_change}</p>;
                                          }
                                        })()}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Fallback for old format */}
                              {result.deepresearch_reasons_for_change && (
                                <div className="research-section">
                                  <div 
                                    className="research-header"
                                    onClick={() => toggleResearchSection('reasons-legacy')}
                                  >
                                    <h5 className="section-title">Reasons for Changes (Legacy)</h5>
                                    <div className={`expand-icon ${expandedResearchSections['reasons-legacy'] ? 'expanded' : ''}`}>
                                      ▼
                                    </div>
                                  </div>
                                  {expandedResearchSections['reasons-legacy'] && (
                                    <div className="research-content">
                                      <div className="reasons-list">
                                        {(() => {
                                          try {
                                            const reasons = JSON.parse(result.deepresearch_reasons_for_change);
                                            return Array.isArray(reasons) ? (
                                              <ul>
                                                {reasons.map((reason, reasonIndex) => (
                                                  <li key={reasonIndex}>{reason}</li>
                                                ))}
                                              </ul>
                                            ) : (
                                              <p>{result.deepresearch_reasons_for_change}</p>
                                            );
                                          } catch {
                                            return <p>{result.deepresearch_reasons_for_change}</p>;
                                          }
                                        })()}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Fallback for old format */}
                              {!result.deepresearch_original && !result.deepresearch_improved_text && (
                                <>
                                  {result.title && <h5 className="section-title">{result.title}</h5>}
                                  {result.summary && <p className="section-summary">{result.summary}</p>}
                                  {result.key_points && (
                                    <div className="key-points">
                                      <h6>Key Points:</h6>
                                      <ul>
                                        {result.key_points.map((point, pointIndex) => (
                                          <li key={pointIndex}>{point}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {result.details && <p className="section-details">{result.details}</p>}
                                  {result.sources && (
                                    <div className="sources">
                                      <h6>Sources:</h6>
                                      <ul>
                                        {result.sources.map((source, sourceIndex) => (
                                          <li key={sourceIndex}>
                                            <a href={source.url} target="_blank" rel="noopener noreferrer">
                                              {source.title || source.url}
                                            </a>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </>
                              )}
                              
                              {/* Raw data fallback */}
                              {!result.deepresearch_original && !result.deepresearch_improved_text && !result.title && !result.summary && !result.key_points && !result.details && !result.sources && (
                                <div className="raw-data">
                                  <pre>{JSON.stringify(result, null, 2)}</pre>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="document-section">
                            <div className="raw-data">
                              <pre>{JSON.stringify(researchResults, null, 2)}</pre>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* n8n Chat Container - positioned outside the processing content */}
      <div ref={chatContainerRef} id="n8n-chat-container"></div>

      {!isInitialized && processingStatus === 'initializing' && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Initializing AI Agent...</p>
        </div>
      )}
    </div>
  )
}

export default ProcessingPhase
