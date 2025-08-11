import React from 'react'
import ResearchCard from './ResearchCard'
import './ResultsGrid.css'

function ResultsGrid({ results, onItemSelect, selectedItems = [] }) {
  if (!Array.isArray(results)) {
    return (
      <pre className="result-data">{JSON.stringify(results, null, 2)}</pre>
    )
  }

  return (
    <div className="results-grid">
      {results.map((item, index) => (
        <ResearchCard 
          key={index} 
          item={item} 
          onSelect={onItemSelect}
          isSelected={selectedItems.some(selected => selected.PMID === item.PMID)}
        />
      ))}
    </div>
  )
}

export default ResultsGrid
