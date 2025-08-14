import React, { useState, useEffect } from 'react'
import './ProcessingPhase.css'

function ProcessingPhase({ runId, onBack, onComplete }) {
  const [researchData, setResearchData] = useState(null)
  const [editedResearch, setEditedResearch] = useState(null)
  const [newsletterData, setNewsletterData] = useState(null)
  const [qcData, setQcData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [topics, setTopics] = useState([])
  
  // Collapsible section states
  const [expandedSections, setExpandedSections] = useState({
    deepResearch: true,
    editResearch: true,
    newsletterWriting: true,
    qualityControl: true
  })

  // Processing status states
  const [processingStatus, setProcessingStatus] = useState({
    deepResearch: 'pending', // pending, running, completed, failed
    editResearch: 'pending',
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
          console.log('Research completed, moving to editing phase')
          setResearchData(data.data.research_data)
          setProcessingStatus(prev => ({ ...prev, deepResearch: 'completed' }))
          setExpandedSections(prev => ({ ...prev, editResearch: true }))
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
    // Mark edit research as completed when user edits the data
    setProcessingStatus(prev => ({ ...prev, editResearch: 'completed' }))
  }

  const startNewsletterWriting = async () => {
    setIsLoading(true)
    setError(null)
    setProcessingStatus(prev => ({ ...prev, newsletterWriting: 'running' }))
    
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
          setProcessingStatus(prev => ({ ...prev, newsletterWriting: 'completed' }))
          setExpandedSections(prev => ({ ...prev, qualityControl: true }))
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

  const startQualityControl = async () => {
    setIsLoading(true)
    setError(null)
    setProcessingStatus(prev => ({ ...prev, qualityControl: 'running' }))
    
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
          newsletter_data: JSON.stringify(newsletterData),
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

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return 'WAIT'
      case 'running':
        return 'RUN'
      case 'completed':
        return 'DONE'
      case 'failed':
        return 'FAIL'
      default:
        return 'WAIT'
    }
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
          <div 
            className="section-header"
            onClick={() => toggleSection('deepResearch')}
          >
                         <div className="section-title">
               <span className="section-icon">RESEARCH</span>
               <h3>1. Deep Research</h3>
              <span 
                className="status-badge"
                style={{ backgroundColor: getStatusColor(processingStatus.deepResearch) }}
              >
                {getStatusIcon(processingStatus.deepResearch)} {processingStatus.deepResearch}
              </span>
            </div>
            <span className={`expand-icon ${expandedSections.deepResearch ? 'expanded' : ''}`}>
              ▼
            </span>
          </div>
          
          {expandedSections.deepResearch && (
            <div className="section-content">
              {processingStatus.deepResearch === 'pending' && (
                <div className="step-content">
                  <p>Deep research will analyze the selected topics and generate comprehensive content.</p>
                  <button 
                    onClick={startDeepResearch}
                    disabled={isLoading}
                    className="action-button primary"
                  >
                    {isLoading ? 'Starting...' : 'Start Deep Research'}
                  </button>
                </div>
              )}
              
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
                                     {researchData && (
                     <div className="research-preview">
                       <h4>Research Preview:</h4>
                       <div className="content-preview">
                         <pre>{JSON.stringify(researchData, null, 2)}</pre>
                       </div>
                     </div>
                   )}
                   <div className="section-actions">
                     <button 
                       onClick={() => setExpandedSections(prev => ({ ...prev, editResearch: true }))}
                       className="action-button primary"
                     >
                       Next: Edit Research
                     </button>
                   </div>
                </div>
              )}
              
              {processingStatus.deepResearch === 'failed' && (
                <div className="step-content">
                                     <div className="error-message">
                     <p>ERROR: Deep research failed. Please try again.</p>
                   </div>
                  <button 
                    onClick={startDeepResearch}
                    className="action-button primary"
                  >
                    Retry Deep Research
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Edit Research Section */}
        <div className="collapsible-section">
          <div 
            className="section-header"
            onClick={() => toggleSection('editResearch')}
          >
                         <div className="section-title">
               <span className="section-icon">EDIT</span>
               <h3>2. Edit Research</h3>
              <span 
                className="status-badge"
                style={{ backgroundColor: getStatusColor(processingStatus.editResearch) }}
              >
                {getStatusIcon(processingStatus.editResearch)} {processingStatus.editResearch}
              </span>
            </div>
            <span className={`expand-icon ${expandedSections.editResearch ? 'expanded' : ''}`}>
              ▼
            </span>
          </div>
          
          {expandedSections.editResearch && (
            <div className="section-content">
              {processingStatus.deepResearch === 'completed' ? (
                <div className="step-content">
                  <ResearchEditor 
                    researchData={researchData}
                    onEdit={handleResearchEdit}
                    onProceed={startNewsletterWriting}
                    isLoading={isLoading}
                  />
                </div>
              ) : (
                <div className="step-content">
                  <p>Please complete the Deep Research step first.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Newsletter Writing Section */}
        <div className="collapsible-section">
          <div 
            className="section-header"
            onClick={() => toggleSection('newsletterWriting')}
          >
                         <div className="section-title">
               <span className="section-icon">NEWSLETTER</span>
               <h3>3. Newsletter Writing</h3>
              <span 
                className="status-badge"
                style={{ backgroundColor: getStatusColor(processingStatus.newsletterWriting) }}
              >
                {getStatusIcon(processingStatus.newsletterWriting)} {processingStatus.newsletterWriting}
              </span>
            </div>
            <span className={`expand-icon ${expandedSections.newsletterWriting ? 'expanded' : ''}`}>
              ▼
            </span>
          </div>
          
          {expandedSections.newsletterWriting && (
            <div className="section-content">
              {processingStatus.newsletterWriting === 'pending' && (
                <div className="step-content">
                  <p>Newsletter writing will generate content based on the edited research.</p>
                  {processingStatus.editResearch === 'completed' && (
                    <button 
                      onClick={startNewsletterWriting}
                      disabled={isLoading}
                      className="action-button primary"
                    >
                      {isLoading ? 'Starting...' : 'Start Newsletter Writing'}
                    </button>
                  )}
                </div>
              )}
              
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
                                     {newsletterData && (
                     <div className="newsletter-preview">
                       <h4>Newsletter Preview:</h4>
                       <div className="content-preview">
                         <pre>{JSON.stringify(newsletterData, null, 2)}</pre>
                       </div>
                     </div>
                   )}
                   <div className="section-actions">
                     <button 
                       onClick={() => setExpandedSections(prev => ({ ...prev, qualityControl: true }))}
                       className="action-button primary"
                     >
                       Next: Quality Control
                     </button>
                   </div>
                </div>
              )}
              
              {processingStatus.newsletterWriting === 'failed' && (
                <div className="step-content">
                                     <div className="error-message">
                     <p>ERROR: Newsletter writing failed. Please try again.</p>
                   </div>
                  <button 
                    onClick={startNewsletterWriting}
                    className="action-button primary"
                  >
                    Retry Newsletter Writing
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quality Control Section */}
        <div className="collapsible-section">
          <div 
            className="section-header"
            onClick={() => toggleSection('qualityControl')}
          >
                         <div className="section-title">
               <span className="section-icon">QC</span>
               <h3>4. Quality Control</h3>
              <span 
                className="status-badge"
                style={{ backgroundColor: getStatusColor(processingStatus.qualityControl) }}
              >
                {getStatusIcon(processingStatus.qualityControl)} {processingStatus.qualityControl}
              </span>
            </div>
            <span className={`expand-icon ${expandedSections.qualityControl ? 'expanded' : ''}`}>
              ▼
            </span>
          </div>
          
          {expandedSections.qualityControl && (
            <div className="section-content">
              {processingStatus.qualityControl === 'pending' && (
                <div className="step-content">
                  <p>Quality control will review and finalize the newsletter content.</p>
                  {processingStatus.newsletterWriting === 'completed' && (
                    <button 
                      onClick={startQualityControl}
                      disabled={isLoading}
                      className="action-button primary"
                    >
                      {isLoading ? 'Starting...' : 'Start Quality Control'}
                    </button>
                  )}
                </div>
              )}
              
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
                                     {qcData && (
                     <div className="qc-preview">
                       <h4>Final Results:</h4>
                       <div className="content-preview">
                         <pre>{JSON.stringify(qcData, null, 2)}</pre>
                       </div>
                     </div>
                   )}
                   <div className="section-actions">
                     <button 
                       onClick={() => onComplete(qcData)}
                       className="action-button primary"
                     >
                       Complete: View Final Results
                     </button>
                   </div>
                </div>
              )}
              
              {processingStatus.qualityControl === 'failed' && (
                <div className="step-content">
                                     <div className="error-message">
                     <p>ERROR: Quality control failed. Please try again.</p>
                   </div>
                  <button 
                    onClick={startQualityControl}
                    className="action-button primary"
                  >
                    Retry Quality Control
                  </button>
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
function ResearchEditor({ researchData, onEdit, onProceed, isLoading }) {
  const [editedData, setEditedData] = useState(researchData || {})

  useEffect(() => {
    if (researchData) {
      setEditedData(researchData)
    }
  }, [researchData])

  const handleEdit = (field, value) => {
    const newData = {
      ...editedData,
      [field]: value
    }
    setEditedData(newData)
    onEdit(newData)
  }

  const handleProceed = () => {
    onEdit(editedData)
    onProceed()
  }

  if (!researchData) {
    return <div>No research data available</div>
  }

  return (
    <div className="research-editor">
      <div className="editor-section">
        <h4>Deep Research Content</h4>
        <textarea
          value={editedData.deepresearch_original || ''}
          onChange={(e) => handleEdit('deepresearch_original', e.target.value)}
          placeholder="Deep research content from n8n..."
          rows={12}
          className="edit-textarea"
        />
      </div>

                         <div className="editor-actions">
                     <button 
                       onClick={handleProceed} 
                       disabled={isLoading}
                       className="action-button primary"
                     >
                       {isLoading ? 'Starting Newsletter Writing...' : 'Next: Newsletter Writing'}
                     </button>
                   </div>
    </div>
  )
}

export default ProcessingPhase


