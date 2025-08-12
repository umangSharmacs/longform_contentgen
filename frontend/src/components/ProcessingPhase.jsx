import React, { useState, useEffect, useRef } from 'react'
import { createChat } from '@n8n/chat'
import '@n8n/chat/style.css'
import './ProcessingPhase.css'

function ProcessingPhase({ runId, onComplete, onBack }) {
  const [processingStatus, setProcessingStatus] = useState('initializing')
  const [isInitialized, setIsInitialized] = useState(false)
  const [researchResults, setResearchResults] = useState(null)
  const [topics, setTopics] = useState([])
  const [isDeepResearchRunning, setIsDeepResearchRunning] = useState(false)
  const chatContainerRef = useRef(null)
  const chatInstanceRef = useRef(null)
  const pollingIntervalRef = useRef(null)

  useEffect(() => {
    // Initialize the processing phase
    initializeProcessing()
    
    // Start polling for research results
    startPollingForResults()
    
    // Cleanup polling on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
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

  const startPollingForResults = () => {
    // Poll every 10 seconds for research results
    pollingIntervalRef.current = setInterval(async () => {
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
        
        if (data.success && data.data.status === 'completed') {
          // Research is ready!
          setResearchResults(data.data.research_results)
          setProcessingStatus('completed')
          setIsDeepResearchRunning(false)
          
          // Stop polling
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
          }
          
          // Call onComplete with results
          if (onComplete) {
            onComplete(data.data)
          }
        }
      } catch (error) {
        console.error('Error checking research status:', error)
      }
    }, 10000) // Check every 10 seconds
  }

  const startDeepResearch = async () => {
    if (isDeepResearchRunning) return

    setIsDeepResearchRunning(true)
    
    try {
      const nonce = window.nslfg_ajax?.nonce
      if (!nonce) {
        throw new Error('Security token not available')
      }

      // Get all previous phases data
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

      const contextData = await response.json()
      
      if (!contextData.success) {
        throw new Error('Failed to get run context')
      }

      // Prepare deep research data
      const deepResearchData = {
        action: 'deepresearch-longformgen',
        run_id: runId,
        timestamp: new Date().toISOString(),
        source: 'wordpress_frontend',
        previous_phases: {
          selected_items: contextData.data.selected_items || [],
          topics: contextData.data.topics || [],
          search_results: contextData.data.search_results || []
        }
      }

      // Send to deep research webhook
      const webhookResponse = await fetch('/wp-admin/admin-ajax.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'start-deep-research',
          run_id: runId,
          nonce: nonce,
          deep_research_data: JSON.stringify(deepResearchData)
        })
      })

      const data = await webhookResponse.json()
      
      if (data.success) {
        console.log('Deep research started successfully')
        // Start polling for results
        startPollingForResults()
      } else {
        throw new Error(data.data || 'Failed to start deep research')
      }
    } catch (error) {
      console.error('Error starting deep research:', error)
      setIsDeepResearchRunning(false)
    }
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
          {/* Left Column - Topics */}
          <div className="topics-panel">
            <h3>Selected Topics</h3>
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

          {/* Right Column - Deep Research Document */}
          <div className="research-panel">
            <div className="research-controls">
              <h3>Deep Research</h3>
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
                          {!result.title && !result.summary && !result.key_points && !result.details && !result.sources && (
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
