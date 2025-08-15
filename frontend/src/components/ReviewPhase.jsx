import React, { useState } from 'react'
import './ReviewPhase.css'

function ReviewPhase({ finalData, onBack }) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownloadDocx = async () => {
    setIsDownloading(true)
    
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
          action: 'download-content-docx',
          final_data: JSON.stringify(finalData),
          nonce: nonce
        })
      })

      if (response.ok) {
        // Create blob and download
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `longform-content-${new Date().toISOString().split('T')[0]}.docx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        throw new Error('Failed to generate document')
      }
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download document: ' + error.message)
    } finally {
      setIsDownloading(false)
    }
  }

  const getFinalContent = () => {
    // Try to get QC content first (most final)
    if (finalData.qc) {
      if (finalData.qc.qc_content) {
        return finalData.qc.qc_content
      } else if (finalData.qc.final_content) {
        return finalData.qc.final_content
      } else if (typeof finalData.qc === 'string') {
        return finalData.qc
      }
    }
    
    // Try newsletter content next
    if (finalData.newsletter) {
      if (finalData.newsletter.newsletter_content) {
        return finalData.newsletter.newsletter_content
      } else if (finalData.newsletter.content) {
        return finalData.newsletter.content
      } else if (typeof finalData.newsletter === 'string') {
        return finalData.newsletter
      }
    }
    
    // Try research content last
    if (finalData.research) {
      if (finalData.research.deepresearch_original) {
        return finalData.research.deepresearch_original
      } else if (finalData.research.deepresearch_improved_text) {
        return finalData.research.deepresearch_improved_text
      } else if (finalData.research.content) {
        return finalData.research.content
      } else if (typeof finalData.research === 'string') {
        return finalData.research
      }
    }
    
    // If no structured data, try to find any content
    if (typeof finalData === 'string') {
      return finalData
    }
    
    // Last resort - show the raw data for debugging
    return JSON.stringify(finalData, null, 2)
  }

  return (
    <div className="review-phase">
      <div className="review-header">
        <h2>Generated Content Review</h2>
        <div className="review-actions">
          <button onClick={onBack} className="back-button">
            Back to Processing
          </button>
          <button 
            onClick={handleDownloadDocx}
            disabled={isDownloading}
            className="download-button"
          >
            {isDownloading ? 'Generating...' : 'Download as DOCX'}
          </button>
        </div>
      </div>

      <div className="review-content">
        <div className="content-section">
          <h3>Final Generated Content</h3>
          <div className="content-display">
            <pre className="content-text">{getFinalContent()}</pre>
          </div>
        </div>

        <div className="content-summary">
          <h4>Content Summary</h4>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Research Phase:</span>
              <span className="summary-value">
                {finalData.research ? 'Completed' : 'Not available'}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Newsletter Phase:</span>
              <span className="summary-value">
                {finalData.newsletter ? 'Completed' : 'Not available'}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Quality Control:</span>
              <span className="summary-value">
                {finalData.qc ? 'Completed' : 'Not available'}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Content Length:</span>
              <span className="summary-value">
                {getFinalContent().length} characters
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReviewPhase
