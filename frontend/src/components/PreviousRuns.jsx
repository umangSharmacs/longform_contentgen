import React, { useState, useEffect } from 'react';
import './PreviousRuns.css';

const PreviousRuns = ({ onLoadRun }) => {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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

  const handleDeleteRun = async (runId) => {
    try {
      const formData = new FormData();
      formData.append('action', 'delete-run-longformgen');
      formData.append('nonce', window.nslfg_ajax.nonce);
      formData.append('run_id', runId);

      const response = await fetch(window.nslfg_ajax.ajax_url, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        // Remove the deleted run from the list
        setRuns(prevRuns => prevRuns.filter(run => run.run_id !== runId));
        setDeleteConfirm(null);
      } else {
        setError(data.data || 'Failed to delete run');
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

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return '#28a745';
      case 'failed':
        return '#dc3545';
      case 'processing':
        return '#ffc107';
      case 'selection':
        return '#17a2b8';
      case 'topics':
        return '#6f42c1';
      default:
        return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return '✓';
      case 'failed':
        return '✗';
      case 'processing':
        return '⟳';
      case 'selection':
        return '⚙';
      case 'topics':
        return '📝';
      default:
        return '•';
    }
  };

  if (loading) {
    return (
      <div className="previous-runs">
        <h3>Previous Runs</h3>
        <div className="previous-runs-loading">
          <div className="loading-spinner"></div>
          <p>Loading previous runs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="previous-runs">
        <h3>Previous Runs</h3>
        <div className="previous-runs-error">
          <p>Error: {error}</p>
          <button onClick={loadPreviousRuns} className="retry-button">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="previous-runs">
      <h3>Previous Runs</h3>
      {runs.length === 0 ? (
        <div className="previous-runs-empty">
          <div className="empty-icon">📋</div>
          <p>No previous runs found</p>
          <small>Start a new run to see it here</small>
        </div>
      ) : (
        <div className="runs-list">
          {runs.map((run) => (
            <div key={run.run_id} className="run-item">
              <div className="run-info">
                <div className="run-header">
                  <div className="run-id">{run.run_id.substring(0, 8)}...</div>
                  <div 
                    className="run-status"
                    style={{ color: getStatusColor(run.status) }}
                  >
                    <span className="status-icon">{getStatusIcon(run.status)}</span>
                    {run.status}
                  </div>
                </div>
                <div className="run-details">
                  <div className="run-date">{formatDate(run.created_at)}</div>
                  <div className="run-phases">{getPhaseStatus(run)}</div>
                </div>
              </div>
              <div className="run-actions">
                {deleteConfirm === run.run_id ? (
                  <div className="delete-confirmation">
                    <span className="confirm-text">Delete?</span>
                    <button 
                      onClick={() => handleDeleteRun(run.run_id)}
                      className="confirm-delete-button"
                    >
                      Yes
                    </button>
                    <button 
                      onClick={() => setDeleteConfirm(null)}
                      className="cancel-delete-button"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={() => handleLoadRun(run.run_id)}
                      className="load-run-button"
                    >
                      Load
                    </button>
                    <button 
                      onClick={() => setDeleteConfirm(run.run_id)}
                      className="delete-run-button"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PreviousRuns;
