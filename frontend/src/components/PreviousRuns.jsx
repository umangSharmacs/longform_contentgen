import React, { useState, useEffect } from 'react';
import './PreviousRuns.css';

const PreviousRuns = ({ onLoadRun }) => {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPreviousRuns();
  }, []);

  const loadPreviousRuns = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('action', 'get-previous-runs-longformgen');
      formData.append('nonce', window.nslfg_ajax.nonce);

      const response = await fetch(window.nslfg_ajax.ajax_url, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        setRuns(data.data);
      } else {
        setError(data.data || 'Failed to load previous runs');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadRun = async (runId) => {
    try {
      const formData = new FormData();
      formData.append('action', 'get-run-data-longformgen');
      formData.append('nonce', window.nslfg_ajax.nonce);
      formData.append('run_id', runId);

      const response = await fetch(window.nslfg_ajax.ajax_url, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        onLoadRun(data.data);
      } else {
        setError(data.data || 'Failed to load run data');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getPhaseStatus = (run) => {
    const phases = [];
    if (run.has_search > 0) phases.push('Search');
    if (run.has_selection > 0) phases.push('Selection');
    if (run.has_topics > 0) phases.push('Topics');
    
    return phases.length > 0 ? phases.join(' → ') : 'No phases';
  };

  if (loading) {
    return <div className="previous-runs-loading">Loading previous runs...</div>;
  }

  if (error) {
    return (
      <div className="previous-runs-error">
        <p>Error: {error}</p>
        <button onClick={loadPreviousRuns} className="retry-button">Retry</button>
      </div>
    );
  }

  if (runs.length === 0) {
    return <div className="previous-runs-empty">No previous runs found.</div>;
  }

  return (
    <div className="previous-runs">
      <h3>Previous Runs</h3>
      <div className="runs-list">
        {runs.map((run) => (
          <div key={run.run_id} className="run-item">
            <div className="run-info">
              <div className="run-id">{run.run_id.substring(0, 8)}...</div>
              <div className="run-date">{formatDate(run.created_at)}</div>
              <div className="run-status">{run.status}</div>
              <div className="run-phases">{getPhaseStatus(run)}</div>
            </div>
            <button 
              onClick={() => handleLoadRun(run.run_id)}
              className="load-run-button"
            >
              Load Run
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PreviousRuns;
