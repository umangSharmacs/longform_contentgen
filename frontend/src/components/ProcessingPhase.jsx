import React, { useState, useEffect } from 'react'
import './ProcessingPhase.css'

function ProcessingPhase({ runId, onBack, onComplete, initialData, allRunData }) {
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
  }, [runId])

  // Restore state from initialData if available
  useEffect(() => {
    if (initialData) {
      console.log('Restoring processing state from initialData:', initialData)
      
      // Set topics if available in initialData
      if (initialData.topics && initialData.topics.length > 0) {
        console.log('Restoring topics from initialData:', initialData.topics)
        setTopics(initialData.topics)
      }
      
      if (initialData.research) {
        console.log('Restoring research data:', initialData.research)
        setResearchData(initialData.research)
        setEditedResearch(initialData.research)
        setProcessingStatus(prev => ({ ...prev, deepResearch: 'completed' }))
      } else {
        console.log('No research data found in initialData')
      }
      
      if (initialData.newsletter) {
        console.log('Restoring newsletter data:', initialData.newsletter)
        setNewsletterData(initialData.newsletter)
        setEditedNewsletter(initialData.newsletter)
        setProcessingStatus(prev => ({ ...prev, newsletterWriting: 'completed' }))
        setExpandedSections(prev => ({ ...prev, newsletterWriting: true }))
      } else {
        console.log('No newsletter data found in initialData')
      }
      
      if (initialData.qc) {
        console.log('Restoring QC data:', initialData.qc)
        setQcData(initialData.qc)
        setEditedQcData(initialData.qc)
        setProcessingStatus(prev => ({ ...prev, qualityControl: 'completed' }))
        setExpandedSections(prev => ({ ...prev, qualityControl: true }))
      } else {
        console.log('No QC data found in initialData')
      }
    }
  }, [initialData])

  // Restore state from allRunData if available (takes precedence over initialData)
  useEffect(() => {
    if (allRunData) {
      console.log('Restoring processing state from allRunData:', allRunData)
      
      // Set topics if available in allRunData
      if (allRunData.topics?.topics && allRunData.topics.topics.length > 0) {
        console.log('Restoring topics from allRunData:', allRunData.topics.topics)
        setTopics(allRunData.topics.topics)
      }
      
      if (allRunData.processing?.research) {
        console.log('Restoring research data from allRunData:', allRunData.processing.research)
        setResearchData(allRunData.processing.research)
        setEditedResearch(allRunData.processing.research)
        setProcessingStatus(prev => ({ ...prev, deepResearch: 'completed' }))
      } else {
        console.log('No research data found in allRunData')
      }
      
      if (allRunData.processing?.newsletter) {
        console.log('Restoring newsletter data from allRunData:', allRunData.processing.newsletter)
        setNewsletterData(allRunData.processing.newsletter)
        setEditedNewsletter(allRunData.processing.newsletter)
        setProcessingStatus(prev => ({ ...prev, newsletterWriting: 'completed' }))
        setExpandedSections(prev => ({ ...prev, newsletterWriting: true }))
      } else {
        console.log('No newsletter data found in allRunData')
      }
      
      if (allRunData.processing?.qc) {
        console.log('Restoring QC data from allRunData:', allRunData.processing.qc)
        setQcData(allRunData.processing.qc)
        setEditedQcData(allRunData.processing.qc)
        setProcessingStatus(prev => ({ ...prev, qualityControl: 'completed' }))
        setExpandedSections(prev => ({ ...prev, qualityControl: true }))
      } else {
        console.log('No QC data found in allRunData')
      }
    }
  }, [allRunData])

  const initializeProcessing = async () => {
    try {
      console.log('Initializing processing with pre-loaded data:', { allRunData, initialData })
      
      // Use pre-loaded data if available
      if (allRunData) {
        console.log('Using pre-loaded data for initialization')
        
        // Set topics from pre-loaded data
        if (allRunData.topics?.topics && topics.length === 0) {
          setTopics(allRunData.topics.topics)
          console.log('Topics set from pre-loaded data:', allRunData.topics.topics)
        }
        
        // Set research data from pre-loaded data
        if (allRunData.processing?.research && !researchData) {
          setResearchData(allRunData.processing.research)
          setEditedResearch(allRunData.processing.research)
          setProcessingStatus(prev => ({ ...prev, deepResearch: 'completed' }))
          console.log('Research data set from pre-loaded data')
        }
        
        // Set newsletter data from pre-loaded data
        if (allRunData.processing?.newsletter && !newsletterData) {
          setNewsletterData(allRunData.processing.newsletter)
          setEditedNewsletter(allRunData.processing.newsletter)
          setProcessingStatus(prev => ({ ...prev, newsletterWriting: 'completed' }))
          setExpandedSections(prev => ({ ...prev, newsletterWriting: true }))
          console.log('Newsletter data set from pre-loaded data')
        }
        
        // Set QC data from pre-loaded data
        if (allRunData.processing?.qc && !qcData) {
          setQcData(allRunData.processing.qc)
          setEditedQcData(allRunData.processing.qc)
          setProcessingStatus(prev => ({ ...prev, qualityControl: 'completed' }))
          setExpandedSections(prev => ({ ...prev, qualityControl: true }))
          console.log('QC data set from pre-loaded data')
        }
        
        return // Exit early since we have pre-loaded data
      }
      
      // Fallback to API calls if no pre-loaded data
      console.log('No pre-loaded data, falling back to API calls')
      
      // Only load topics if we don't have them already
      if (topics.length === 0) {
        await loadTopics()
      }
      
      // Try to load research data if not already loaded
      if (!researchData && !initialData?.research) {
        await loadResearchData()
      }
      
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

      // First try to get topics from get-run-context
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
        if (topicsData.length > 0) {
          setTopics(topicsData)
          console.log('Loaded topics from get-run-context:', topicsData)
          return
        } else {
          console.log('No topics found in get-run-context response')
        }
      } else {
        console.error('Failed to load topics from get-run-context:', data.data)
      }
      
      // Fallback: try to get topics from get-run-data
      console.log('Trying fallback method to load topics...')
      const fallbackResponse = await fetch('/wp-admin/admin-ajax.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'get-run-data-longformgen',
          run_id: runId,
          nonce: nonce
        })
      })

      const fallbackData = await fallbackResponse.json()
      
      if (fallbackData.success && fallbackData.data.topics_phase) {
        try {
          const topicsData = JSON.parse(fallbackData.data.topics_phase.topics)
          if (topicsData && topicsData.length > 0) {
            setTopics(topicsData)
            console.log('Loaded topics from fallback method:', topicsData)
            return
          }
        } catch (e) {
          console.error('Error parsing topics from fallback method:', e)
        }
      }
      
      console.log('Could not load topics from any method')
    } catch (error) {
      console.error('Error loading topics:', error)
    }
  }

  const loadResearchData = async () => {
    try {
      const nonce = window.nslfg_ajax?.nonce
      if (!nonce) {
        throw new Error('Security token not available')
      }

      console.log('Loading research data from database...')
      
      // First try to get research data from get-run-data
      const response = await fetch('/wp-admin/admin-ajax.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'get-run-data-longformgen',
          run_id: runId,
          nonce: nonce
        })
      })

      const data = await response.json()
      
      if (data.success && data.data.processing_phase) {
        const processingData = data.data.processing_phase
        console.log('Processing phase data:', processingData)
        
        if (processingData.research_results) {
          try {
            const researchResults = JSON.parse(processingData.research_results)
            console.log('Research results found:', researchResults)
            if (researchResults && researchResults.length > 0) {
              setResearchData(researchResults[0])
              setEditedResearch(researchResults[0])
              setProcessingStatus(prev => ({ ...prev, deepResearch: 'completed' }))
              console.log('Research data loaded successfully')
              return
            }
          } catch (e) {
            console.error('Error parsing research results:', e)
          }
        } else {
          console.log('No research_results field found')
        }
      } else {
        console.error('Failed to load research data from get-run-data:', data.data)
      }
      
      // Fallback: try to check research status
      console.log('Trying to check research status...')
      const statusResponse = await fetch('/wp-admin/admin-ajax.php', {
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

      const statusData = await statusResponse.json()
      console.log('Research status response:', statusData)
      
      if (statusData.success && statusData.data.research_completed) {
        console.log('Research is completed, loading data...')
        setResearchData(statusData.data.research_data)
        setEditedResearch(statusData.data.research_data)
        setProcessingStatus(prev => ({ ...prev, deepResearch: 'completed' }))
        console.log('Research data loaded from status check')
      } else {
        console.log('Research not completed or no data available')
      }
    } catch (error) {
      console.error('Error loading research data:', error)
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
        setTimeout(poll, 60000) // Poll every minute
      } catch (error) {
        console.error('Error polling for research completion:', error)
        attempts++
        setTimeout(poll, 60000)
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
        setTimeout(poll, 60000) // Poll every minute
      } catch (error) {
        console.error('Error polling for newsletter completion:', error)
        attempts++
        setTimeout(poll, 60000)
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
        
        // Add debugging
        console.log('QC Status Check Response:', data)
        console.log('QC completed:', data.success && data.data?.qc_completed)
        console.log('QC data:', data.data?.qc_data)
        
        if (data.success && data.data.qc_completed) {
          console.log('Setting QC data:', data.data.qc_data)
          setQcData(data.data.qc_data)
          setEditedQcData(data.data.qc_data)
          setProcessingStatus(prev => ({ ...prev, qualityControl: 'completed' }))
          return
        }

        attempts++
        setTimeout(poll, 60000) // Poll every minute
      } catch (error) {
        console.error('Error polling for QC completion:', error)
        attempts++
        setTimeout(poll, 60000)
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
          <button 
            onClick={restartQualityControl}
            disabled={isLoading}
            className="action-button restart"
          >
            Restart
          </button>
        )
      }
    }
    
    return null
  }

  const allStagesCompleted = () => {
    return processingStatus.deepResearch === 'completed' && 
           processingStatus.newsletterWriting === 'completed' && 
           processingStatus.qualityControl === 'completed'
  }

  const handleMoveToReview = () => {
    const finalData = {
      research: editedResearch || researchData,
      newsletter: editedNewsletter || newsletterData,
      qc: editedQcData || qcData
    }
    
    console.log('Moving to review with final data:', finalData)
    console.log('Research data:', finalData.research)
    console.log('Newsletter data:', finalData.newsletter)
    console.log('QC data:', finalData.qc)
    
    onComplete(finalData)
  }

  const checkDatabaseData = async () => {
    try {
      const nonce = window.nslfg_ajax?.nonce
      if (!nonce) {
        throw new Error('Security token not available')
      }

      console.log('=== DEBUGGING DATABASE DATA ===')
      console.log('Run ID:', runId)
      console.log('Current topics state:', topics)
      console.log('Current initialData:', initialData)

      const response = await fetch('/wp-admin/admin-ajax.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'check-run-data',
          run_id: runId,
          nonce: nonce
        })
      })

      const data = await response.json()
      console.log('Database data for run:', data)
      
      if (data.success) {
        const runData = data.data
        console.log('Run info:', runData.run_info)
        console.log('Search phase:', runData.search_phase)
        console.log('Selection phase:', runData.selection_phase)
        console.log('Topics phase:', runData.topics_phase)
        console.log('Processing phase:', runData.processing_phase)
        
        // Try to load topics from the database data
        if (runData.topics_phase && runData.topics_phase.topics) {
          try {
            const topicsData = JSON.parse(runData.topics_phase.topics)
            console.log('Topics found in database:', topicsData)
            if (topicsData && topicsData.length > 0) {
              setTopics(topicsData)
              console.log('Topics loaded from database data')
            }
          } catch (e) {
            console.error('Error parsing topics from database:', e)
          }
        }
        
        // Try to load research data from the database
        if (runData.processing_phase && runData.processing_phase.research_results) {
          try {
            const researchResults = JSON.parse(runData.processing_phase.research_results)
            console.log('Research results found in database:', researchResults)
            if (researchResults && researchResults.length > 0) {
              console.log('Research data available:', researchResults[0])
              // Set the research data directly
              setResearchData(researchResults[0])
              setEditedResearch(researchResults[0])
              setProcessingStatus(prev => ({ ...prev, deepResearch: 'completed' }))
              console.log('Research data loaded from database')
            }
          } catch (e) {
            console.error('Error parsing research results from database:', e)
          }
        } else {
          console.log('No research_results field found in processing_phase')
        }
      } else {
        console.error('Failed to get database data:', data.data)
      }
    } catch (error) {
      console.error('Error checking database data:', error)
    }
  }

  // Add this to the component to call it when needed
  useEffect(() => {
    if (runId) {
      console.log('Checking database data for run:', runId)
      checkDatabaseData()
    }
  }, [runId])

  return (
    <div className="processing-phase">
      <div className="processing-header">
        <h2>Content Generation Pipeline</h2>
        <div className="header-buttons">
          <button onClick={onBack} className="back-button">
            Back to Topics
          </button>
          <button onClick={checkDatabaseData} className="debug-button">
            Debug Data
          </button>
        </div>
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

      {/* Topics Display */}
      {topics.length > 0 ? (
        <div className="topics-display">
          <h3>Loaded Topics ({topics.length})</h3>
          <div className="topics-list">
            {topics.map((topic, index) => (
              <div key={index} className="topic-item">
                <h4>{topic.topic_name || topic.topic}</h4>
                <p>{topic.description}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="topics-display">
          <h3>No Topics Loaded</h3>
          <p>Topics are being loaded from the database. If this persists, try clicking the "Debug Data" button.</p>
          <button onClick={loadTopics} className="action-button primary">
            Manually Load Topics
          </button>
        </div>
      )}

      {/* Research Data Display */}
      {researchData ? (
        <div className="research-display">
          <h3>Research Data Loaded</h3>
          <div className="research-info">
            <p><strong>Status:</strong> {processingStatus.deepResearch}</p>
            <p><strong>Content Available:</strong> {researchData.deepresearch_original ? 'Yes' : 'No'}</p>
            {researchData.deepresearch_original && (
              <p><strong>Content Length:</strong> {researchData.deepresearch_original.length} characters</p>
            )}
          </div>
        </div>
      ) : (
        <div className="research-display">
          <h3>No Research Data Loaded</h3>
          <p>Research data is not available. Try clicking "Check for Existing Research Data" in the Deep Research section.</p>
          <button onClick={loadResearchData} className="action-button primary">
            Load Research Data
          </button>
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
                  <button onClick={loadResearchData} className="action-button primary">
                    Try to Load Research Data
                  </button>
                </div>
              )}
              
              {processingStatus.deepResearch === 'pending' && (
                <div className="step-content">
                  <p>Deep research has not been started yet. Click "Start Research" to begin.</p>
                  <button onClick={loadResearchData} className="action-button primary">
                    Check for Existing Research Data
                  </button>
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

      {allStagesCompleted() && (
        <div className="next-button-container">
          <button onClick={handleMoveToReview} className="action-button primary">
            Next: Review Generated Content
          </button>
        </div>
      )}
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
        <h4>Newsletter Title</h4>
        <input
          type="text"
          value={localEditedData.newsletter_title || ''}
          onChange={(e) => handleEdit('newsletter_title', e.target.value)}
          placeholder="Newsletter title from n8n..."
          className="edit-input"
        />
      </div>
      
      <div className="editor-section">
        <h4>Newsletter Summary</h4>
        <textarea
          value={localEditedData.newsletter_summary || ''}
          onChange={(e) => handleEdit('newsletter_summary', e.target.value)}
          placeholder="Newsletter summary from n8n..."
          rows={4}
          className="edit-textarea"
        />
      </div>
      
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

  // Get the content from the correct field
  const getQcContent = () => {
    return localEditedData.qc_content || 
           localEditedData.final_content || 
           localEditedData.content || 
           ''
  }

  return (
    <div className="qc-editor">
      <div className="editor-section">
        <h4>Final Content</h4>
        <textarea
          value={getQcContent()}
          onChange={(e) => handleEdit('qc_content', e.target.value)}
          placeholder="Final QC content from n8n..."
          rows={12}
          className="edit-textarea"
        />
      </div>
      
      <div className="editor-section">
        <h4>QC Score</h4>
        <input
          type="text"
          value={localEditedData.qc_score || ''}
          onChange={(e) => handleEdit('qc_score', e.target.value)}
          placeholder="QC score (e.g., 85/100)"
          className="edit-input"
        />
      </div>
      
      <div className="editor-section">
        <h4>QC Feedback</h4>
        <textarea
          value={localEditedData.qc_feedback || ''}
          onChange={(e) => handleEdit('qc_feedback', e.target.value)}
          placeholder="QC feedback and recommendations..."
          rows={6}
          className="edit-textarea"
        />
      </div>
      
      <div className="editor-section">
        <h4>QC Recommendations</h4>
        <textarea
          value={localEditedData.qc_recommendations || ''}
          onChange={(e) => handleEdit('qc_recommendations', e.target.value)}
          placeholder="QC recommendations for improvement..."
          rows={4}
          className="edit-textarea"
        />
      </div>
    </div>
  )
}

export default ProcessingPhase


