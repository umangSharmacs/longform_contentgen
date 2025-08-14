import { useState } from 'react'
import ResultsGrid from './components/ResultsGrid'
import SelectionPhase from './components/SelectionPhase'
import TopicsPhase from './components/TopicsPhase'
import ProcessingPhase from './components/ProcessingPhase'
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

  const handleFetchData = async () => {
    setIsLoading(true)
    setResult(null)
    
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
    setCurrentPhase('selection')
    setTopics([])
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
    setCurrentPhase('processing')
  }

  const handleProcessingComplete = (qcData) => {
    console.log('Processing completed with QC data:', qcData)
    // Store the final QC data and move to review phase
    setCurrentPhase('review')
  }

  const handleBackToTopics = () => {
    setCurrentPhase('topics')
  }

  const handleLoadPreviousRun = (runData) => {
    
    // Determine the highest phase completed
    let highestPhase = 'search'
    if (runData.topics_phase) {
      highestPhase = 'topics'
    } else if (runData.selection_phase) {
      highestPhase = 'selection'
    } else if (runData.search_phase) {
      highestPhase = 'search'
    }
    
    // Set the current phase and load data
    setCurrentPhase(highestPhase)
    setCurrentRunId(runData.run_info.run_id)
    
    // Load phase-specific data
    if (runData.search_phase) {
      const searchCriteria = JSON.parse(runData.search_phase.search_criteria)
      setMinDate(searchCriteria.min_date || '')
      setMaxDate(searchCriteria.max_date || '')
      setDataType(searchCriteria.data_type || 'unused')
    }
    
    if (runData.selection_phase) {
      const selectedItems = JSON.parse(runData.selection_phase.selected_items)
      setResult(selectedItems) // This will show the selected items in selection phase
    }
    
    if (runData.topics_phase) {
      const topicsData = JSON.parse(runData.topics_phase.topics)
      setTopics(topicsData)
    }
  }

  // Render processing phase
  if (currentPhase === 'processing') {
    return (
      <div className="app processing-app">
        <PhaseFlow currentPhase={currentPhase} />
        
        <header className="app-header">
          <h1>NeedleSpotter LongformGen</h1>
          <p>AI Agent Chat - Generate Content</p>
        </header>

        <main className="app-main">
          <ProcessingPhase 
            runId={currentRunId}
            onComplete={handleProcessingComplete}
            onBack={handleBackToTopics}
          />
        </main>
      </div>
    )
  }

  // Render topics phase
  if (currentPhase === 'topics') {
    return (
      <div className="app selection-app">
        <PhaseFlow currentPhase={currentPhase} />
        
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
          />
        </main>
      </div>
    )
  }

  // Render selection phase
  if (currentPhase === 'selection' && result && !result.error) {
    return (
      <div className="app selection-app">
        <PhaseFlow currentPhase={currentPhase} />
        
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
          />
        </main>
      </div>
    )
  }

  // Render search phase
  return (
    <div className="app search-phase">
      <PhaseFlow currentPhase={currentPhase} />
      
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
