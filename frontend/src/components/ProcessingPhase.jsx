import React, { useState, useEffect } from 'react'
import './ProcessingPhase.css'

function ProcessingPhase({ runId, onBack, onComplete }) {
  const [researchData, setResearchData] = useState(null)
  const [editedResearch, setEditedResearch] = useState(null)
  const [newsletterData, setNewsletterData] = useState(null)
  const [editedNewsletter, setEditedNewsletter] = useState(null)
  const [qcData, setQcData] = useState(null)
  const [editedQcData, setEditedQcData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [topics, setTopics] = useState([])
  
  // Collapsible section states
  const [expandedSections, setExpandedSections] = useState({
    deepResearch: true,
    newsletterWriting: false,
    qualityControl: false
  })

  // Processing status states
  const [processingStatus, setProcessingStatus] = useState({
    deepResearch: 'pending', // pending, running, completed, failed
    newsletterWriting: 'pending',
    qualityControl: 'pending'
  })

  useEffect(() => {
    initializeProcessing()
  }, [])

  const initializeProcessing = async () => {
    try {
      await loadTopics()
      // Don't automatically start deep research - let user initiate it
    } catch (error) {
      console.error('Processing initialization error:', error)
      setError('Failed to initialize processing')
    }
  }

  const updateDatabaseSchema = async () => {
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
          action: 'update-database-schema',
          nonce: nonce
        })
      })

      const data = await response.json()
      
      if (data.success) {
        console.log('Database schema updated successfully')
        setError(null)
      } else {
        throw new Error(data.data || 'Failed to update database schema')
      }
    } catch (error) {
      console.error('Error updating database schema:', error)
      setError('Failed to update database schema: ' + error.message)
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

  const startDeepResearch = async () => {
    setIsLoading(true)
    setError(null)
    setProcessingStatus(prev => ({ ...prev, deepResearch: 'running' }))
    
    // Clear downstream stages when restarting
    setNewsletterData(null)
    setEditedNewsletter(null)
    setQcData(null)
    setEditedQcData(null)
    setProcessingStatus(prev => ({ 
      ...prev, 
      newsletterWriting: 'pending',
      qualityControl: 'pending'
    }))
    
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
          action: 'deepresearch-longformgen',
          run_id: runId,
          topics: JSON.stringify(topics),
          nonce: nonce
        })
      })

      const data = await response.json()
      
      if (data.success) {
        console.log('Deep research started successfully')
        // Start polling for research completion
        pollForResearchCompletion()
      } else {
        throw new Error(data.data || 'Failed to start deep research')
      }
    } catch (error) {
      console.error('Error starting deep research:', error)
      setError('Failed to start deep research: ' + error.message)
      setProcessingStatus(prev => ({ ...prev, deepResearch: 'failed' }))
    } finally {
      setIsLoading(false)
    }
  }

  const restartDeepResearch = () => {
    startDeepResearch()
  }

  const pollForResearchCompletion = async () => {
    const maxAttempts = 60
    let attempts = 0

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setError('Research completion timeout. Please check the status manually.')
        setProcessingStatus(prev => ({ ...prev, deepResearch: 'failed' }))
        return
      }

      try {
        const nonce = window.nslfg_ajax?.nonce
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
        
        console.log('Research status check response:', data)
        
        if (data.success && data.data.research_completed) {
          console.log('Research completed, data ready for editing')
          setResearchData(data.data.research_data)
          setEditedResearch(data.data.research_data)
          setProcessingStatus(prev => ({ ...prev, deepResearch: 'completed' }))
          return
        } else {
          console.log('Research not completed yet, continuing to poll...')
        }

        attempts++
        setTimeout(poll, 5000) // Poll every 5 seconds
      } catch (error) {
        console.error('Error polling for research completion:', error)
        attempts++
        setTimeout(poll, 5000)
      }
    }

    poll()
  }

  const handleResearchEdit = (editedData) => {
    setEditedResearch(editedData)
  }

  const startNewsletterWriting = async () => {
    setIsLoading(true)
    setError(null)
    setProcessingStatus(prev => ({ ...prev, newsletterWriting: 'running' }))
    setExpandedSections(prev => ({ ...prev, newsletterWriting: true }))
    
    // Clear downstream stages when restarting
    setQcData(null)
    setEditedQcData(null)
    setProcessingStatus(prev => ({ 
      ...prev, 
      qualityControl: 'pending'
    }))
    
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
          action: 'longform-newsletter-writing',
          run_id: runId,
          research_data: JSON.stringify(editedResearch || researchData),
          nonce: nonce
        })
      })

      const data = await response.json()
      
      if (data.success) {
        console.log('Newsletter writing started successfully')
        pollForNewsletterCompletion()
      } else {
        throw new Error(data.data || 'Failed to start newsletter writing')
      }
    } catch (error) {
      console.error('Error starting newsletter writing:', error)
      setError('Failed to start newsletter writing: ' + error.message)
      setProcessingStatus(prev => ({ ...prev, newsletterWriting: 'failed' }))
    } finally {
      setIsLoading(false)
    }
  }

  const restartNewsletterWriting = () => {
    startNewsletterWriting()
  }

  const pollForNewsletterCompletion = async () => {
    const maxAttempts = 60
    let attempts = 0

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setError('Newsletter completion timeout. Please check the status manually.')
        setProcessingStatus(prev => ({ ...prev, newsletterWriting: 'failed' }))
        return
      }

      try {
        const nonce = window.nslfg_ajax?.nonce
        const response = await fetch('/wp-admin/admin-ajax.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            action: 'check-newsletter-status',
            run_id: runId,
            nonce: nonce
          })
        })

        const data = await response.json()
        
        if (data.success && data.data.newsletter_completed) {
          setNewsletterData(data.data.newsletter_data)
          setEditedNewsletter(data.data.newsletter_data)
          setProcessingStatus(prev => ({ ...prev, newsletterWriting: 'completed' }))
          return
        }

        attempts++
        setTimeout(poll, 5000) // Poll every 5 seconds
      } catch (error) {
        console.error('Error polling for newsletter completion:', error)
        attempts++
        setTimeout(poll, 5000)
      }
    }

    poll()
  }

  const handleNewsletterEdit = (editedData) => {
    setEditedNewsletter(editedData)
  }

  const startQualityControl = async () => {
    setIsLoading(true)
    setError(null)
    setProcessingStatus(prev => ({ ...prev, qualityControl: 'running' }))
    setExpandedSections(prev => ({ ...prev, qualityControl: true }))
    
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
          action: 'longform-QC',
          run_id: runId,
          newsletter_data: JSON.stringify(editedNewsletter || newsletterData),
          nonce: nonce
        })
      })

      const data = await response.json()
      
      if (data.success) {
        console.log('Quality control started successfully')
        pollForQCCompletion()
      } else {
        throw new Error(data.data || 'Failed to start quality control')
      }
    } catch (error) {
      console.error('Error starting quality control:', error)
      setError('Failed to start quality control: ' + error.message)
      setProcessingStatus(prev => ({ ...prev, qualityControl: 'failed' }))
    } finally {
      setIsLoading(false)
    }
  }

  const restartQualityControl = () => {
    startQualityControl()
  }

  const pollForQCCompletion = async () => {
    const maxAttempts = 60
    let attempts = 0

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setError('QC completion timeout. Please check the status manually.')
        setProcessingStatus(prev => ({ ...prev, qualityControl: 'failed' }))
        return
      }

      try {
        const nonce = window.nslfg_ajax?.nonce
        const response = await fetch('/wp-admin/admin-ajax.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            action: 'check-qc-status',
            run_id: runId,
            nonce: nonce
          })
        })

        const data = await response.json()
        
        if (data.success && data.data.qc_completed) {
          setQcData(data.data.qc_data)
          setEditedQcData(data.data.qc_data)
          setProcessingStatus(prev => ({ ...prev, qualityControl: 'completed' }))
          return
        }

        attempts++
        setTimeout(poll, 5000) // Poll every 5 seconds
      } catch (error) {
        console.error('Error polling for QC completion:', error)
        attempts++
        setTimeout(poll, 5000)
      }
    }

    poll()
  }

  const handleQcEdit = (editedData) => {
    setEditedQcData(editedData)
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#6c757d'
      case 'running':
        return '#007bff'
      case 'completed':
        return '#28a745'
      case 'failed':
        return '#dc3545'
      default:
        return '#6c757d'
    }
  }

  const getSectionHeaderButtons = (stage) => {
    const status = processingStatus[stage]
    
    if (stage === 'deepResearch') {
      if (status === 'pending') {
        return (
          <button 
            onClick={startDeepResearch}
            disabled={isLoading}
            className="action-button primary"
          >
            {isLoading ? 'Starting...' : 'Start Research'}
          </button>
        )
      } else if (status === 'failed') {
        return (
          <button 
            onClick={restartDeepResearch}
            disabled={isLoading}
            className="action-button retry"
          >
            Retry
          </button>
        )
      } else if (status === 'completed') {
        return (
          <button 
            onClick={restartDeepResearch}
            disabled={isLoading}
            className="action-button restart"
          >
            Restart
          </button>
        )
      }
    } else if (stage === 'newsletterWriting') {
      if (status === 'pending' && processingStatus.deepResearch === 'completed') {
        return (
          <button 
            onClick={startNewsletterWriting}
            disabled={isLoading}
            className="action-button primary"
          >
            {isLoading ? 'Starting...' : 'Start Newsletter'}
          </button>
        )
      } else if (status === 'failed') {
        return (
          <button 
            onClick={restartNewsletterWriting}
            disabled={isLoading}
            className="action-button retry"
          >
            Retry
          </button>
        )
      } else if (status === 'completed') {
        return (
          <button 
            onClick={restartNewsletterWriting}
            disabled={isLoading}
            className="action-button restart"
          >
            Restart
          </button>
        )
      }
    } else if (stage === 'qualityControl') {
      if (status === 'pending' && processingStatus.newsletterWriting === 'completed') {
        return (
          <button 
            onClick={startQualityControl}
            disabled={isLoading}
            className="action-button primary"
          >
            {isLoading ? 'Starting...' : 'Start QC'}
          </button>
        )
      } else if (status === 'failed') {
        return (
          <button 
            onClick={restartQualityControl}
            disabled={isLoading}
            className="action-button retry"
          >
            Retry
          </button>
        )
      } else if (status === 'completed') {
        return (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={restartQualityControl}
              disabled={isLoading}
              className="action-button restart"
            >
              Restart
            </button>
            <button 
              onClick={() => onComplete(editedQcData || qcData)}
              disabled={isLoading}
              className="action-button primary"
            >
              Complete
            </button>
          </div>
        )
      }
    }
    
    return null
  }

  return (
    <div className="processing-phase">
      <div className="processing-header">
        <h2>Content Generation Pipeline</h2>
        <button onClick={onBack} className="back-button">
          Back to Topics
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={() => setError(null)}>Dismiss</button>
            {error.includes('Database update failed') && (
              <button onClick={updateDatabaseSchema} className="action-button primary">
                Fix Database Schema
              </button>
            )}
          </div>
        </div>
      )}

      <div className="processing-content">
        {/* Deep Research Section */}
        <div className="collapsible-section">
          <div className="section-header">
            <div 
              className="section-title"
              onClick={() => toggleSection('deepResearch')}
              style={{ cursor: 'pointer' }}
            >
              <h3>1. Deep Research</h3>
              <span 
                className="status-badge"
                style={{ backgroundColor: getStatusColor(processingStatus.deepResearch) }}
              >
                {processingStatus.deepResearch}
              </span>
            </div>
            <div className="section-header-buttons">
              {getSectionHeaderButtons('deepResearch')}
            </div>
            <span 
              className={`expand-icon ${expandedSections.deepResearch ? 'expanded' : ''}`}
              onClick={() => toggleSection('deepResearch')}
              style={{ cursor: 'pointer' }}
            >
              ▼
            </span>
          </div>
          
          {expandedSections.deepResearch && (
            <div className="section-content">
              {processingStatus.deepResearch === 'running' && (
                <div className="step-content">
                  <div className="loading-indicator">
                    <div className="spinner"></div>
                    <p>Deep research in progress... This may take several minutes.</p>
                  </div>
                </div>
              )}
              
              {processingStatus.deepResearch === 'completed' && (
                <div className="step-content">
                  <div className="success-message">
                    <p>SUCCESS: Deep research completed successfully!</p>
                  </div>
                  <ResearchEditor 
                    researchData={researchData}
                    editedData={editedResearch}
                    onEdit={handleResearchEdit}
                  />
                </div>
              )}
              
              {processingStatus.deepResearch === 'failed' && (
                <div className="step-content">
                  <div className="error-message">
                    <p>ERROR: Deep research failed. Please try again.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Newsletter Writing Section */}
        <div className="collapsible-section">
          <div className="section-header">
            <div 
              className="section-title"
              onClick={() => toggleSection('newsletterWriting')}
              style={{ cursor: 'pointer' }}
            >
              <h3>2. Newsletter Writing</h3>
              <span 
                className="status-badge"
                style={{ backgroundColor: getStatusColor(processingStatus.newsletterWriting) }}
              >
                {processingStatus.newsletterWriting}
              </span>
            </div>
            <div className="section-header-buttons">
              {getSectionHeaderButtons('newsletterWriting')}
            </div>
            <span 
              className={`expand-icon ${expandedSections.newsletterWriting ? 'expanded' : ''}`}
              onClick={() => toggleSection('newsletterWriting')}
              style={{ cursor: 'pointer' }}
            >
              ▼
            </span>
          </div>
          
          {expandedSections.newsletterWriting && (
            <div className="section-content">
              {processingStatus.newsletterWriting === 'running' && (
                <div className="step-content">
                  <div className="loading-indicator">
                    <div className="spinner"></div>
                    <p>Newsletter writing in progress... This may take several minutes.</p>
                  </div>
                </div>
              )}
              
              {processingStatus.newsletterWriting === 'completed' && (
                <div className="step-content">
                  <div className="success-message">
                    <p>SUCCESS: Newsletter writing completed successfully!</p>
                  </div>
                  <NewsletterEditor 
                    newsletterData={newsletterData}
                    editedData={editedNewsletter}
                    onEdit={handleNewsletterEdit}
                  />
                </div>
              )}
              
              {processingStatus.newsletterWriting === 'failed' && (
                <div className="step-content">
                  <div className="error-message">
                    <p>ERROR: Newsletter writing failed. Please try again.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quality Control Section */}
        <div className="collapsible-section">
          <div className="section-header">
            <div 
              className="section-title"
              onClick={() => toggleSection('qualityControl')}
              style={{ cursor: 'pointer' }}
            >
              <h3>3. Quality Control</h3>
              <span 
                className="status-badge"
                style={{ backgroundColor: getStatusColor(processingStatus.qualityControl) }}
              >
                {processingStatus.qualityControl}
              </span>
            </div>
            <div className="section-header-buttons">
              {getSectionHeaderButtons('qualityControl')}
            </div>
            <span 
              className={`expand-icon ${expandedSections.qualityControl ? 'expanded' : ''}`}
              onClick={() => toggleSection('qualityControl')}
              style={{ cursor: 'pointer' }}
            >
              ▼
            </span>
          </div>
          
          {expandedSections.qualityControl && (
            <div className="section-content">
              {processingStatus.qualityControl === 'running' && (
                <div className="step-content">
                  <div className="loading-indicator">
                    <div className="spinner"></div>
                    <p>Quality control in progress... This may take several minutes.</p>
                  </div>
                </div>
              )}
              
              {processingStatus.qualityControl === 'completed' && (
                <div className="step-content">
                  <div className="success-message">
                    <p>SUCCESS: Quality control completed successfully!</p>
                  </div>
                  <QcEditor 
                    qcData={qcData}
                    editedData={editedQcData}
                    onEdit={handleQcEdit}
                  />
                </div>
              )}
              
              {processingStatus.qualityControl === 'failed' && (
                <div className="step-content">
                  <div className="error-message">
                    <p>ERROR: Quality control failed. Please try again.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Research Editor Component
function ResearchEditor({ researchData, editedData, onEdit }) {
  const [localEditedData, setLocalEditedData] = useState(editedData || {})

  useEffect(() => {
    if (researchData) {
      setLocalEditedData(researchData)
    }
  }, [researchData])

  const handleEdit = (field, value) => {
    const newData = {
      ...localEditedData,
      [field]: value
    }
    setLocalEditedData(newData)
    onEdit(newData)
  }

  if (!researchData) {
    return <div>No research data available</div>
  }

  return (
    <div className="research-editor">
      <div className="editor-section">
        <h4>Deep Research Content</h4>
        <textarea
          value={localEditedData.deepresearch_original || ''}
          onChange={(e) => handleEdit('deepresearch_original', e.target.value)}
          placeholder="Deep research content from n8n..."
          rows={12}
          className="edit-textarea"
        />
      </div>
    </div>
  )
}

// Newsletter Editor Component
function NewsletterEditor({ newsletterData, editedData, onEdit }) {
  const [localEditedData, setLocalEditedData] = useState(editedData || {})

  useEffect(() => {
    if (newsletterData) {
      setLocalEditedData(newsletterData)
    }
  }, [newsletterData])

  const handleEdit = (field, value) => {
    const newData = {
      ...localEditedData,
      [field]: value
    }
    setLocalEditedData(newData)
    onEdit(newData)
  }

  if (!newsletterData) {
    return <div>No newsletter data available</div>
  }

  return (
    <div className="newsletter-editor">
      <div className="editor-section">
        <h4>Newsletter Content</h4>
        <textarea
          value={localEditedData.newsletter_content || ''}
          onChange={(e) => handleEdit('newsletter_content', e.target.value)}
          placeholder="Newsletter content from n8n..."
          rows={12}
          className="edit-textarea"
        />
      </div>
    </div>
  )
}

// QC Editor Component
function QcEditor({ qcData, editedData, onEdit }) {
  const [localEditedData, setLocalEditedData] = useState(editedData || {})

  useEffect(() => {
    if (qcData) {
      setLocalEditedData(qcData)
    }
  }, [qcData])

  const handleEdit = (field, value) => {
    const newData = {
      ...localEditedData,
      [field]: value
    }
    setLocalEditedData(newData)
    onEdit(newData)
  }

  if (!qcData) {
    return <div>No QC data available</div>
  }

  return (
    <div className="qc-editor">
      <div className="editor-section">
        <h4>Final Content</h4>
        <textarea
          value={localEditedData.final_content || ''}
          onChange={(e) => handleEdit('final_content', e.target.value)}
          placeholder="Final QC content from n8n..."
          rows={12}
          className="edit-textarea"
        />
      </div>
    </div>
  )
}

export default ProcessingPhase


