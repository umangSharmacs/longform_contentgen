import React, { useState } from 'react'
import ResultsGrid from './ResultsGrid'
import './SelectionPhase.css'

function SelectionPhase({ results, runId, onBack, onProceed }) {
  const [selectedItems, setSelectedItems] = useState([])
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleItemSelect = (item) => {
    setSelectedItems(prev => {
      const isSelected = prev.some(selected => selected.PMID === item.PMID)
      if (isSelected) {
        return prev.filter(selected => selected.PMID !== item.PMID)
      } else {
        return [...prev, item]
      }
    })
  }

  const handleSelectAll = () => {
    setSelectedItems(results)
  }

  const handleClearSelection = () => {
    setSelectedItems([])
  }

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files)
    const validFiles = files.filter(file => {
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
      return validTypes.includes(file.type)
    })
    
    setUploadedFiles(prev => [...prev, ...validFiles])
    event.target.value = '' // Reset input
  }

  const handleRemoveFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleProceed = async () => {
    if (selectedItems.length === 0 && uploadedFiles.length === 0) {
      alert('Please select at least one research item or upload at least one file.')
      return
    }

    setIsSubmitting(true)
    
    try {
      const nonce = window.nslfg_ajax?.nonce
      if (!nonce) {
        alert('Security token not available. Please refresh the page.')
        return
      }

      // Prepare form data
      const formData = new FormData()
      formData.append('action', 'selected-items-longformgen')
      formData.append('nonce', nonce)
      formData.append('run_id', runId)
      formData.append('selected_items', JSON.stringify(selectedItems))
      
      // Add files
      uploadedFiles.forEach((file, index) => {
        formData.append(`file_${index}`, file)
      })
      formData.append('file_count', uploadedFiles.length.toString())

      // Send request to WordPress backend
      const response = await fetch('/wp-admin/admin-ajax.php', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
              if (data.success) {
          console.log('Selected items and files sent successfully:', data.data)
          
          // Extract topics from the response if available
          const responseData = data.data
          console.log('=== DEBUGGING TOPICS EXTRACTION ===')
          console.log('Full response data:', responseData)
          console.log('responseData.output:', responseData.output)
          console.log('responseData.output?.topics:', responseData.output?.topics)
          
          // Try different ways to extract topics
          let topics = []
          if (responseData.topics) {
            topics = responseData.topics
            console.log('Found topics in responseData.topics')
          } else if (responseData.output && responseData.output.topics) {
            topics = responseData.output.topics
            console.log('Found topics in responseData.output.topics')
          } else if (responseData[0] && responseData[0].output && responseData[0].output.topics) {
            topics = responseData[0].output.topics
            console.log('Found topics in responseData[0].output.topics')
          } else {
            console.log('No topics found in any expected location')
          }
          
          console.log('Final topics extracted:', topics)
          console.log('Topics type:', typeof topics)
          console.log('Topics length:', topics.length)
        
        // Call the onProceed callback with topics
        if (onProceed) {
          onProceed(selectedItems, topics)
        }
      } else {
        alert('Failed to send items: ' + (data.data || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error sending selected items:', error)
      alert('Failed to send items. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="selection-phase">
      <div className="selection-header">
        <div className="selection-title">
          <h2>Select Research Items</h2>
          <p>Choose the research items you want to work with</p>
        </div>
        
        <div className="selection-controls">
          <button 
            onClick={handleSelectAll}
            className="control-button select-all"
            disabled={selectedItems.length === results.length}
          >
            Select All
          </button>
          <button 
            onClick={handleClearSelection}
            className="control-button clear-selection"
            disabled={selectedItems.length === 0}
          >
            Clear Selection
          </button>
          <button 
            onClick={onBack}
            className="control-button back-button"
          >
            Back to Search
          </button>
        </div>
      </div>

      <div className="selection-stats">
        <span className="total-items">Total: {results.length} items</span>
        <span className="selected-items">Selected: {selectedItems.length} items</span>
        <span className="uploaded-files">Files: {uploadedFiles.length} uploaded</span>
      </div>

      <div className="results-section">
        <ResultsGrid 
          results={results} 
          onItemSelect={handleItemSelect}
          selectedItems={selectedItems}
        />
      </div>

      <div className="file-upload-section">
        <h3>Add Additional Files</h3>
        <p>Upload supporting documents (PDF, DOCX, TXT)</p>
        
        <div className="file-upload-area">
          <input
            type="file"
            multiple
            accept=".pdf,.docx,.txt"
            onChange={handleFileUpload}
            className="file-input"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="file-upload-label">
            <span className="upload-icon">📁</span>
            <span>Choose files or drag them here</span>
            <span className="file-types">Supported: PDF, DOCX, TXT</span>
          </label>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="uploaded-files-list">
            <h4>Uploaded Files:</h4>
            <div className="files-grid">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="file-item">
                  <div className="file-info">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button 
                    onClick={() => handleRemoveFile(index)}
                    className="remove-file-btn"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="selection-footer">
        <button 
          onClick={handleProceed}
          disabled={isSubmitting || (selectedItems.length === 0 && uploadedFiles.length === 0)}
          className="proceed-button"
        >
          {isSubmitting ? 'Sending...' : `Proceed with ${selectedItems.length} Items & ${uploadedFiles.length} Files`}
        </button>
      </div>
    </div>
  )
}

export default SelectionPhase
