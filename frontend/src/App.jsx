import { useState } from 'react'
import ResultsGrid from './components/ResultsGrid'
import SelectionPhase from './components/SelectionPhase'
import TopicsPhase from './components/TopicsPhase'
import ProcessingPhase from './components/ProcessingPhase'
import ReviewPhase from './components/ReviewPhase'
import PhaseFlow from './components/PhaseFlow'
import PreviousRuns from './components/PreviousRuns'
import NewRunForm from './components/NewRunForm'
import './App.css'

function App() {
  const [minDate, setMinDate] = useState('')
  const [maxDate, setMaxDate] = useState('')
  const [dataType, setDataType] = useState('unused')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [currentPhase, setCurrentPhase] = useState('search') // 'search', 'selection', 'topics', 'processing', 'review'
  const [topics, setTopics] = useState([])
  const [currentRunId, setCurrentRunId] = useState(null)
  const [finalData, setFinalData] = useState(null)
  const [processingData, setProcessingData] = useState(null)
  const [allRunData, setAllRunData] = useState(null)

  // Navigation functions for PhaseFlow
  const handleNavigateBack = () => {
    const phases = ['search', 'selection', 'topics', 'processing', 'review']
    const currentIndex = phases.indexOf(currentPhase)
    
    if (currentIndex > 0) {
      const previousPhase = phases[currentIndex - 1]
      console.log(`Navigating back from ${currentPhase} to ${previousPhase}`)
      
      switch (previousPhase) {
        case 'search':
          setCurrentPhase('search')
          break
        case 'selection':
          setCurrentPhase('selection')
          break
        case 'topics':
          setCurrentPhase('topics')
          break
        case 'processing':
          setCurrentPhase('processing')
          break
        case 'review':
          setCurrentPhase('review')
          break
      }
    }
  }

  const handleNavigateForward = () => {
    const phases = ['search', 'selection', 'topics', 'processing', 'review']
    const currentIndex = phases.indexOf(currentPhase)
    
    if (currentIndex < phases.length - 1) {
      const nextPhase = phases[currentIndex + 1]
      console.log(`Navigating forward from ${currentPhase} to ${nextPhase}`)
      
      // Always allow forward navigation - let the phase handle its own data requirements
      setCurrentPhase(nextPhase)
      console.log(`Successfully navigated to ${nextPhase}`)
    }
  }

  const canGoBack = () => {
    const phases = ['search', 'selection', 'topics', 'processing', 'review']
    const currentIndex = phases.indexOf(currentPhase)
    return currentIndex > 0
  }

  const canGoForward = () => {
    const phases = ['search', 'selection', 'topics', 'processing', 'review']
    const currentIndex = phases.indexOf(currentPhase)
    
    // Always allow forward navigation if not on the last phase
    return currentIndex < phases.length - 1
  }

  const handleFetchData = async () => {
    setIsLoading(true)
    setResult(null)
    
    // Clear any previous run data when starting a new run
    setAllRunData(null)
    
    try {
      const nonce = window.nslfg_ajax?.nonce
      if (!nonce) {
        setResult({ error: 'Security token not available. Please refresh the page.' })
        return
      }
      
      // Send request to WordPress backend
      const response = await fetch('/wp-admin/admin-ajax.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'fetch-data-longformgen',
          minDate: minDate || '',
          maxDate: maxDate || '',
          dataType: dataType,
          nonce: nonce
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Handle the new response structure
        const responseData = data.data
        if (responseData && responseData.data && Array.isArray(responseData.data)) {
          // New structure: { data: [...], run_id: "..." }
          setResult(responseData.data)
          setCurrentRunId(responseData.run_id || null)
        } else if (Array.isArray(responseData)) {
          // Old structure: direct array
          setResult(responseData)
          setCurrentRunId(null)
        } else {
          // Other response format
          setResult(responseData)
          setCurrentRunId(responseData.run_id || null)
        }
        setCurrentPhase('selection') // Move to selection phase
      } else {
        setResult({ error: data.data || 'Failed to fetch data' })
      }
    } catch (error) {
      console.error('NSLFG Error:', error);
      setResult({ error: 'Failed to connect to WordPress backend' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToSearch = () => {
    setCurrentPhase('search')
    setResult(null)
    setTopics([])
  }

  const handleBackToSelection = () => {
    console.log('Navigating back to selection with pre-loaded data')
    setCurrentPhase('selection')
    // Selection data is already loaded in state, no need for API calls
    // Don't clear topics as they might be needed for later phases
  }

  const handleSelectionComplete = (selectedItems, topics = []) => {
    // Use topics from n8n response if available, otherwise fall back to mock data
    if (topics && topics.length > 0) {
      console.log('Using topics from n8n:', topics)
      
      // Validate topics structure
      const validTopics = topics.filter(topic => 
        topic && 
        typeof topic === 'object' && 
        (topic.topic_name || topic.topic) && 
        topic.description
      ).map(topic => ({
        topic_name: topic.topic_name || topic.topic,
        description: topic.description
      }))
      
      if (validTopics.length > 0) {
        console.log('Validated topics:', validTopics)
        setTopics(validTopics)
      } else {
        console.log('No valid topics found, using mock data')
        setTopics(getMockTopics())
      }
        } else {
      console.log('No topics from n8n, using mock data')
      setTopics(getMockTopics())
    }
    
    // Update allRunData with selection data
    setAllRunData(prev => ({
      ...prev,
      selection: {
        selectedItems: selectedItems,
        uploadedFiles: [] // This would need to be passed from SelectionPhase
      }
    }))
    
    setCurrentPhase('topics')
  }

  const getMockTopics = () => {
    return [
      {
        topic_name: "Evolving Standards in Cancer Treatment and Prevention",
        description: "Recent research underscores ongoing advancements in both cancer therapeutics and preventive approaches, highlighting the impact of targeted therapies like ibrutinib as well as the importance of evidence-based screening and nutrition interventions to improve patient outcomes and survivorship."
      },
      {
        topic_name: "Addressing Health Equity and Disparities in Cancer Care",
        description: "New studies emphasize the critical role of policy and practice in reducing racial disparities, particularly through cost-effective and broadly accessible screening methods, as well as the need for inclusive guidelines that enhance care for diverse patient populations."
      },
      {
        topic_name: "Bridging Gaps in Evidence-Based Oncology Guidelines",
        description: "The push for rigorous nutrition and intervention research during active treatment signals a broader movement to fill evidence gaps and standardize recommendations, promoting more consistent, high-quality care throughout the cancer continuum."
      }
    ]
  }

  const handleTopicsComplete = (finalTopics, responseData) => {
    console.log('Topics finalized:', finalTopics)
    console.log('Response data:', responseData)
    
    // Update allRunData with topics data
    setAllRunData(prev => ({
      ...prev,
      topics: {
        topics: finalTopics,
        finalTopics: finalTopics
      }
    }))
    
    setCurrentPhase('processing')
  }

  const handleProcessingComplete = (finalData) => {
    console.log('Processing completed with final data:', finalData)
    setFinalData(finalData)
    setProcessingData(finalData) // Store processing data for going back
    
    // Update allRunData with processing data
    setAllRunData(prev => ({
      ...prev,
      processing: finalData
    }))
    
    setCurrentPhase('review')
  }

  const handleBackToTopics = () => {
    console.log('Navigating back to topics with pre-loaded data')
    setCurrentPhase('topics')
    // Topics data is already loaded in state, no need for API calls
    // Data is preserved in allRunData for seamless navigation
  }

  const handleBackToProcessing = () => {
    console.log('Navigating back to processing with pre-loaded data')
    setCurrentPhase('processing')
    // Processing data is already loaded in state, no need for API calls
  }

  const handleLoadPreviousRun = (runData) => {
    console.log('Loading previous run with complete data:', runData)
    
    // Determine the highest phase completed
    let highestPhase = 'search'
    if (runData.processing_phase) {
      highestPhase = 'processing'
    } else if (runData.topics_phase) {
      highestPhase = 'topics'
    } else if (runData.selection_phase) {
      highestPhase = 'selection'
    } else if (runData.search_phase) {
      highestPhase = 'search'
    }
    
    // Set the current phase and run ID
    setCurrentPhase(highestPhase)
    setCurrentRunId(runData.run_info.run_id)
    
    // Pre-load ALL data for seamless navigation
    const allData = {
      search: null,
      selection: null,
      topics: null,
      processing: null
    }
    
    // Load search phase data
    if (runData.search_phase) {
      try {
        const searchCriteria = JSON.parse(runData.search_phase.search_criteria)
        setMinDate(searchCriteria.min_date || '')
        setMaxDate(searchCriteria.max_date || '')
        setDataType(searchCriteria.data_type || 'unused')
        
        allData.search = {
          criteria: searchCriteria,
          results: runData.search_phase.search_results ? JSON.parse(runData.search_phase.search_results) : null
        }
      } catch (e) {
        console.error('Error parsing search phase data:', e)
      }
    }
    
    // Load selection phase data
    if (runData.selection_phase) {
      try {
        const selectedItems = JSON.parse(runData.selection_phase.selected_items)
        setResult(selectedItems)
        
        allData.selection = {
          selectedItems: selectedItems,
          uploadedFiles: runData.selection_phase.uploaded_files ? JSON.parse(runData.selection_phase.uploaded_files) : []
        }
      } catch (e) {
        console.error('Error parsing selection phase data:', e)
      }
    }
    
    // Load topics phase data
    if (runData.topics_phase) {
      try {
        const topicsData = JSON.parse(runData.topics_phase.topics)
        setTopics(topicsData)
        
        allData.topics = {
          topics: topicsData,
          finalTopics: runData.topics_phase.final_topics ? JSON.parse(runData.topics_phase.final_topics) : topicsData
        }
      } catch (e) {
        console.error('Error parsing topics phase data:', e)
      }
    }
    
    // Load processing phase data
    if (runData.processing_phase) {
      const processingData = {
        research: null,
        newsletter: null,
        qc: null,
        topics: allData.topics?.topics || null
      }
      
      // Load research data
      if (runData.processing_phase.research_results) {
        try {
          const researchResults = JSON.parse(runData.processing_phase.research_results)
          if (researchResults && researchResults.length > 0) {
            processingData.research = researchResults[0]
          }
        } catch (e) {
          console.error('Error parsing research results:', e)
        }
      }
      
      // Load newsletter data
      if (runData.processing_phase.newsletter_results) {
        try {
          const newsletterResults = JSON.parse(runData.processing_phase.newsletter_results)
          if (newsletterResults && newsletterResults.length > 0) {
            processingData.newsletter = newsletterResults[0]
          }
        } catch (e) {
          console.error('Error parsing newsletter results:', e)
        }
      }
      
      // Load QC data
      if (runData.processing_phase.qc_results) {
        try {
          const qcResults = JSON.parse(runData.processing_phase.qc_results)
          if (qcResults && qcResults.length > 0) {
            processingData.qc = qcResults[0]
          }
        } catch (e) {
          console.error('Error parsing QC results:', e)
        }
      }
      
      setProcessingData(processingData)
      allData.processing = processingData
    }
    
    // Store all data for navigation
    setAllRunData(allData)
    console.log('All run data loaded and ready for navigation:', allData)
  }

  // Render processing phase
  if (currentPhase === 'processing') {
    return (
      <div className="app processing-app">
        <PhaseFlow 
          currentPhase={currentPhase}
          onNavigateBack={handleNavigateBack}
          onNavigateForward={handleNavigateForward}
          canGoBack={canGoBack()}
          canGoForward={canGoForward()}
        />
        
        <header className="app-header">
          <h1>NeedleSpotter LongformGen</h1>
          <p>AI Agent Chat - Generate Content</p>
        </header>

        <main className="app-main">
          <ProcessingPhase 
            runId={currentRunId}
            onComplete={handleProcessingComplete}
            onBack={handleBackToTopics}
            initialData={processingData}
            allRunData={allRunData}
          />
        </main>
      </div>
    )
  }

  // Render review phase
  if (currentPhase === 'review') {
    // Get final data from either finalData or allRunData
    const reviewData = finalData || allRunData?.processing || null
    
    return (
      <div className="app review-app">
        <PhaseFlow 
          currentPhase={currentPhase}
          onNavigateBack={handleNavigateBack}
          onNavigateForward={handleNavigateForward}
          canGoBack={canGoBack()}
          canGoForward={canGoForward()}
        />
        
        <header className="app-header">
          <h1>NeedleSpotter LongformGen</h1>
          <p>Review and download generated content</p>
        </header>

        <main className="app-main">
          <ReviewPhase 
            finalData={reviewData}
            onBack={handleBackToProcessing}
            allRunData={allRunData}
          />
        </main>
      </div>
    )
  }

  // Render topics phase
  if (currentPhase === 'topics') {
    return (
      <div className="app selection-app">
        <PhaseFlow 
          currentPhase={currentPhase}
          onNavigateBack={handleNavigateBack}
          onNavigateForward={handleNavigateForward}
          canGoBack={canGoBack()}
          canGoForward={canGoForward()}
        />
        
        <header className="app-header">
          <h1>NeedleSpotter LongformGen</h1>
          <p>Review and edit generated topics</p>
        </header>

        <main className="app-main">
          <TopicsPhase 
            topics={topics}
            runId={currentRunId}
            onBack={handleBackToSelection}
            onProceed={handleTopicsComplete}
            allRunData={allRunData}
          />
        </main>
      </div>
    )
  }

  // Render selection phase
  if (currentPhase === 'selection' && result && !result.error) {
    return (
      <div className="app selection-app">
        <PhaseFlow 
          currentPhase={currentPhase}
          onNavigateBack={handleNavigateBack}
          onNavigateForward={handleNavigateForward}
          canGoBack={canGoBack()}
          canGoForward={canGoForward()}
        />
        
        <header className="app-header">
          <h1>NeedleSpotter LongformGen</h1>
          <p>Select research items for processing</p>
        </header>

        <main className="app-main">
          <SelectionPhase 
            results={result} 
            runId={currentRunId}
            onBack={handleBackToSearch}
            onProceed={handleSelectionComplete}
            allRunData={allRunData}
          />
        </main>
      </div>
    )
  }

  // Render search phase
  return (
    <div className="app search-phase">
      <PhaseFlow 
        currentPhase={currentPhase}
        onNavigateBack={handleNavigateBack}
        onNavigateForward={handleNavigateForward}
        canGoBack={canGoBack()}
        canGoForward={canGoForward()}
      />
      
      <header className="app-header">
        <h1>NeedleSpotter LongformGen</h1>
        <p>Fetch and manage your content data</p>
      </header>

      <main className="app-main search-layout">
        <div className="left-panel">
          <PreviousRuns onLoadRun={handleLoadPreviousRun} />
        </div>
        
        <div className="right-panel">
          <NewRunForm 
            onFetchData={({ minDate: newMinDate, maxDate: newMaxDate, dataType: newDataType }) => {
              setMinDate(newMinDate);
              setMaxDate(newMaxDate);
              setDataType(newDataType);
              handleFetchData();
            }}
            isLoading={isLoading}
          />
        </div>

        {result && result.error && (
          <div className="result-container">
            <h3>Error</h3>
            <div className="error-message">{result.error}</div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
