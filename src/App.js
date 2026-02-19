import React, { useState, useRef } from 'react';
import './App.css';

// Backend API URL - Update this with your Azure App Service URL
const BACKEND_URL = "https://appcompliancebot-ddg4c6c6awhbb9d9.swedencentral-01.azurewebsites.net";

function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|txt)$/i)) {
      return { valid: false, error: 'Invalid file type. Supported: PDF, DOC, DOCX, TXT' };
    }
    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 10MB limit' };
    }
    return { valid: true };
  };

  const processFiles = async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError("");
    const newFiles = [];
    
    try {
      for (let file of files) {
        const validation = validateFile(file);
        if (!validation.valid) {
          console.error(`File validation failed: ${validation.error}`);
          setUploadError(validation.error);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);
        
        try {
          const res = await fetch(`${BACKEND_URL}/upload`, {
            method: "POST",
            body: formData
          });
          
          if (res.ok) {
            const data = await res.json();
            console.log('Upload response:', data); // Now it's "used"
            newFiles.push({
              name: file.name,
              size: (file.size / 1024).toFixed(2),
              uploadedAt: new Date().toLocaleTimeString()
            });
            console.log(`Successfully uploaded: ${file.name}`);
          } else {
            const errorData = await res.json();
            console.error(`Upload failed for ${file.name}:`, errorData);
            setUploadError(`Failed to upload ${file.name}: ${errorData.error || 'Unknown error'}`);
          }
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          setUploadError(`Network error uploading ${file.name}`);
        }
      }
      
      if (newFiles.length > 0) {
        setUploadedFiles([...uploadedFiles, ...newFiles]);
        // Show success message
        setTimeout(() => setUploadError(""), 3000);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = (event) => {
    processFiles(event.target.files);
    event.target.value = '';
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    processFiles(e.dataTransfer.files);
  };

  const removeFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const askBot = async () => {
    if (!question.trim()) return;
    
    setLoading(true);
    setAnswer(""); // Clear previous answer
    
    try {
      const res = await fetch(`${BACKEND_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      setAnswer(data.answer || "No response received. Please try again.");
    } catch (error) {
      console.error("Error asking question:", error);
      setAnswer("Error: Unable to fetch response. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askBot();
    }
  };

  return (
    <div className="app-container">
      <div className="app-header">
        <div className="header-content">
          <h1 className="app-title">Compliance Assistant</h1>
          <p className="app-subtitle">AI-Powered Regulatory Document Analysis</p>
        </div>
      </div>

      <div className="app-content">
        <div className="main-panel">
          {/* Document Upload Section */}
          <div className="upload-section">
            <div className="section-header">
              <h2 className="section-title">Upload Documents</h2>
              <p className="section-description">Add regulatory compliance documents for analysis</p>
            </div>
            
            <div 
              className={`upload-area ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                id="file-upload"
                className="file-input"
                multiple
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <label htmlFor="file-upload" className="upload-label">
                <div className="upload-icon">{uploading ? '⏳' : '📄'}</div>
                <span className="upload-text">
                  {uploading ? 'Uploading...' : 'Click to upload or drag & drop'}
                </span>
                <span className="upload-hint">PDF, DOC, DOCX, TXT (Max 10MB each)</span>
              </label>
            </div>

            {uploadError && (
              <div className="upload-error" style={{
                marginTop: '10px',
                padding: '10px',
                backgroundColor: '#fee',
                border: '1px solid #fcc',
                borderRadius: '4px',
                color: '#c33'
              }}>
                {uploadError}
              </div>
            )}

            {uploadedFiles.length > 0 && (
              <div className="uploaded-files">
                <h3 className="files-title">📋 Uploaded Documents ({uploadedFiles.length})</h3>
                <div className="files-list">
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="file-item">
                      <div className="file-info">
                        <span className="file-icon">✓</span>
                        <div className="file-details">
                          <span className="file-name">{file.name}</span>
                          <span className="file-meta">{file.size}KB • {file.uploadedAt}</span>
                        </div>
                      </div>
                      <button
                        className="remove-file-btn"
                        onClick={() => removeFile(idx)}
                        title="Remove file"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Question Section */}
          <div className="question-section">
            <div className="section-header">
              <h2 className="section-title">Ask a Question</h2>
              <p className="section-description">Query the compliance documents with specific questions</p>
            </div>

            <div className="input-wrapper">
              <textarea
                id="question-input"
                className="question-input"
                placeholder="What are the compliance requirements for...?"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                rows="4"
              />
              <div className="input-info">
                {question.length} characters
              </div>
            </div>

            <div className="button-group">
              <button
                className={`submit-button ${loading ? 'loading' : ''}`}
                onClick={askBot}
                disabled={loading || !question.trim()}
              >
                <span className="button-icon">{loading ? '⏳' : '🔍'}</span>
                {loading ? 'Analyzing...' : 'Analyze & Answer'}
              </button>
              {question.length > 0 && (
                <button
                  className="clear-button"
                  onClick={() => setQuestion("")}
                  title="Clear question"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Response Section */}
        {answer && (
          <div className="response-section">
            <div className="response-header">
              <h3 className="response-title">Response</h3>
              <button 
                className="close-button"
                onClick={() => setAnswer("")}
                title="Close response"
              >
                ✕
              </button>
            </div>
            <div className="response-content">
              {answer}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;