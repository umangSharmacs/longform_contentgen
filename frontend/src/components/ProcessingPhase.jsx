import React, { useState, useEffect, useRef } from 'react'
import { createChat } from '@n8n/chat'
import '@n8n/chat/style.css'
import './ProcessingPhase.css'

function ProcessingPhase({ runId, onComplete, onBack }) {
  const [processingStatus, setProcessingStatus] = useState('initializing')
  const [isInitialized, setIsInitialized] = useState(false)
  const chatContainerRef = useRef(null)
  const chatInstanceRef = useRef(null)

  useEffect(() => {
    // Initialize the processing phase
    initializeProcessing()
  }, [])

  const initializeProcessing = async () => {
    setProcessingStatus('initializing')
    
    try {
      const nonce = window.nslfg_ajax?.nonce
      if (!nonce) {
        throw new Error('Security token not available')
      }

      // Start processing phase
      const response = await fetch('/wp-admin/admin-ajax.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'start-processing-longformgen',
          run_id: runId,
          nonce: nonce
        })
      })

      const data = await response.json()
      
      if (data.success) {
        console.log('Chat initializing...')
        setProcessingStatus('ready')
        setIsInitialized(true)
        
        // Initialize n8n chat after a short delay to ensure DOM is ready
        setTimeout(async () => {
          await initializeChat()
        }, 100)
      } else {
        throw new Error(data.data || 'Failed to initialize processing')
      }
    } catch (error) {
      console.error('Processing initialization error:', error)
      setProcessingStatus('error')
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

      // Now get the selected items and topics data
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
      let topics = []
      
      if (contextData.success) {
        selectedItems = contextData.data.selected_items || []
        topics = contextData.data.topics || []
        console.log('Got run context:', { selectedItems, topics })
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
        mode: 'fullscreen',
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
        <div className="n8n-chat-container">
          <div ref={chatContainerRef} id="n8n-chat-container"></div>
        </div>
      )}

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
