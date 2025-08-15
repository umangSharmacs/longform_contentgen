import React, { useState } from 'react';
import './NewRunForm.css';

const NewRunForm = ({ onFetchData, isLoading }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [minDate, setMinDate] = useState('');
  const [maxDate, setMaxDate] = useState('');
  const [dataType, setDataType] = useState('unused');

  const handleStartNewRun = () => {
    if (showOptions) {
      // If options are visible, fetch data with current settings
      onFetchData({ minDate, maxDate, dataType });
    } else {
      // If options are hidden, show them
      setShowOptions(true);
    }
  };

  return (
    <div className="new-run-form">
      <div className="new-run-header">
        <h3>Start New Run</h3>
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="toggle-options-button"
        >
          {showOptions ? 'Hide Options' : 'Show Options'}
        </button>
      </div>

      {showOptions && (
        <div className="fetch-options">
          <div className="form-group">
            <label htmlFor="minDate">Start Date (Optional)</label>
            <input
              type="date"
              id="minDate"
              value={minDate}
              onChange={(e) => setMinDate(e.target.value)}
              className="form-input"
            />
            <small>Leave empty to fetch all data from the beginning</small>
          </div>

          <div className="form-group">
            <label htmlFor="maxDate">End Date (Optional)</label>
            <input
              type="date"
              id="maxDate"
              value={maxDate}
              onChange={(e) => setMaxDate(e.target.value)}
              className="form-input"
            />
            <small>Leave empty to fetch all data until now</small>
          </div>

          <div className="form-group">
            <label htmlFor="dataType">Data Type</label>
            <select
              id="dataType"
              value={dataType}
              onChange={(e) => setDataType(e.target.value)}
              className="form-select"
            >
              <option value="unused">Unused Data Only</option>
              <option value="all">All Data</option>
            </select>
          </div>
        </div>
      )}

      <button
        onClick={handleStartNewRun}
        disabled={isLoading}
        className="start-new-run-button"
      >
        {isLoading ? 'Starting...' : (showOptions ? 'Fetch Data' : 'Start a new run')}
      </button>
    </div>
  );
};

export default NewRunForm;
