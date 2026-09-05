import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Mic, MicOff, Sparkles } from 'lucide-react';

export default function ActivityForm({ activity = null, communities = [], onClose, onSave }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'visit',
    patientName: '',
    patientAge: '',
    patientGender: 'Female',
    village: communities[0]?.name || '',
    details: '',
    outcome: '',
    isUrgent: false
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isListeningDetails, setIsListeningDetails] = useState(false);
  const [isListeningOutcome, setIsListeningOutcome] = useState(false);

  useEffect(() => {
    if (activity) {
      setFormData({
        date: activity.date || new Date().toISOString().split('T')[0],
        type: activity.type || 'visit',
        patientName: activity.patientName || '',
        patientAge: activity.patientAge || '',
        patientGender: activity.patientGender || 'Female',
        village: activity.village || '',
        details: activity.details || '',
        outcome: activity.outcome || '',
        isUrgent: !!activity.isUrgent
      });
    }
  }, [activity]);

  // Voice Recognition Handler (Hindi & Indian English supported)
  const handleVoiceInput = (field) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    if (field === 'details') setIsListeningDetails(true);
    if (field === 'outcome') setIsListeningOutcome(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setFormData(prev => ({
        ...prev,
        [field]: prev[field] ? `${prev[field]} ${transcript}` : transcript
      }));
    };

    recognition.onerror = (err) => {
      console.error('Speech recognition error:', err);
      setIsListeningDetails(false);
      setIsListeningOutcome(false);
    };

    recognition.onend = () => {
      setIsListeningDetails(false);
      setIsListeningOutcome(false);
    };

    recognition.start();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Basic validations
    if (!formData.date) return setError('Date is required.');
    if (!formData.details.trim()) return setError('Please provide activity details.');
    if (!formData.outcome.trim()) return setError('Please provide the outcome/referral.');
    
    if (formData.type !== 'training') {
      if (!formData.patientName.trim()) return setError('Patient name is required for visits and interventions.');
      if (!formData.patientAge || Number(formData.patientAge) < 0) return setError('Please enter a valid patient age.');
    }

    setSubmitting(true);
    try {
      await onSave(formData);
    } catch (err) {
      setError(err.message || 'Failed to save activity log.');
    } finally {
      setSubmitting(false);
    }
  };

  const isTraining = formData.type === 'training';

  return (
    <div className="modal-backdrop">
      <div className="modal-content glass-panel">
        <div className="modal-header">
          <h3>{activity ? 'Update Activity Log' : 'Log Daily Field Activity'}</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="form-error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row split">
            <div className="form-group">
              <label htmlFor="date">Activity Date *</label>
              <input 
                type="date" 
                id="date" 
                name="date"
                className="form-control"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="type">Activity Type *</label>
              <select 
                id="type" 
                name="type"
                className="form-control"
                value={formData.type}
                onChange={handleChange}
              >
                <option value="visit">Home Visit (Routine Check)</option>
                <option value="intervention">Clinical Intervention (Vaccine/Test)</option>
                <option value="training">Community Health Training</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="village">Target Village / Community *</label>
            <select 
              id="village" 
              name="village"
              className="form-control"
              value={formData.village}
              onChange={handleChange}
            >
              {communities.map(c => (
                <option key={c._id} value={c.name}>{c.name} ({c.district})</option>
              ))}
            </select>
          </div>

          {/* Patient Details: Hide if activity is a general Community Training session */}
          {!isTraining && (
            <div className="patient-details-box">
              <h4>Patient Demographics</h4>
              
              <div className="form-group">
                <label htmlFor="patientName">Patient Name *</label>
                <input 
                  type="text" 
                  id="patientName" 
                  name="patientName"
                  placeholder="e.g. Ramesh Singh"
                  className="form-control"
                  value={formData.patientName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row split">
                <div className="form-group">
                  <label htmlFor="patientAge">Age *</label>
                  <input 
                    type="number" 
                    id="patientAge" 
                    name="patientAge"
                    placeholder="e.g. 45"
                    className="form-control"
                    value={formData.patientAge}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="patientGender">Gender *</label>
                  <select 
                    id="patientGender" 
                    name="patientGender"
                    className="form-control"
                    value={formData.patientGender}
                    onChange={handleChange}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Details / Symptoms with Voice Recognition */}
          <div className="form-group">
            <div className="field-label-row">
              <label htmlFor="details">{isTraining ? 'Training Topic & Attendance *' : 'Symptom / Activity Details *'}</label>
              <button 
                type="button" 
                onClick={() => handleVoiceInput('details')}
                className={`voice-mic-btn ${isListeningDetails ? 'listening' : ''}`}
                title="Click to speak symptoms"
              >
                {isListeningDetails ? <MicOff size={14} /> : <Mic size={14} />}
                <span>{isListeningDetails ? 'Listening...' : 'Voice Input (बोलें)'}</span>
              </button>
            </div>
            <textarea 
              id="details" 
              name="details"
              rows="3"
              placeholder={isTraining ? "Describe the training session, attendance, topics covered, hygiene materials distributed..." : "Describe symptoms, blood sugar level, child growth milestones, etc..."}
              className="form-control"
              value={formData.details}
              onChange={handleChange}
              required
            ></textarea>
          </div>

          {/* Outcome & Referral with Voice Recognition */}
          <div className="form-group">
            <div className="field-label-row">
              <label htmlFor="outcome">Outcome & Actions Taken *</label>
              <button 
                type="button" 
                onClick={() => handleVoiceInput('outcome')}
                className={`voice-mic-btn ${isListeningOutcome ? 'listening' : ''}`}
                title="Click to speak outcome"
              >
                {isListeningOutcome ? <MicOff size={14} /> : <Mic size={14} />}
                <span>{isListeningOutcome ? 'Listening...' : 'Voice Input (बोलें)'}</span>
              </button>
            </div>
            <textarea 
              id="outcome" 
              name="outcome"
              rows="2"
              placeholder={isTraining ? "Session feedback, community response, or follow-up plans..." : "e.g., Prescribed iron pills, referred to PHC, scheduled next immunizations..."}
              className="form-control"
              value={formData.outcome}
              onChange={handleChange}
              required
            ></textarea>
          </div>

          {/* Urgent Case Checkbox */}
          {!isTraining && (
            <div className="form-group-checkbox">
              <input 
                type="checkbox" 
                id="isUrgent" 
                name="isUrgent"
                checked={formData.isUrgent}
                onChange={handleChange}
              />
              <label htmlFor="isUrgent">
                <strong>Flag as Critical Case (Urgent Alert)</strong>
                <span>This raises an immediate critical case card in the supervisor panel for emergency review.</span>
              </label>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Save size={18} />
              {submitting ? 'Saving...' : 'Save Log Entry'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(4, 6, 10, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1050;
          padding: 1.5rem;
          overflow-y: auto;
        }

        .modal-content {
          width: 100%;
          max-width: 580px;
          background: rgba(30, 41, 59, 0.9) !important;
          border-color: rgba(255, 255, 255, 0.12) !important;
          padding: 2rem;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 1rem;
        }

        .modal-header h3 {
          font-size: 1.35rem;
          color: hsl(var(--primary));
        }

        .close-btn {
          background: none;
          border: none;
          color: hsl(var(--text-secondary));
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .close-btn:hover {
          color: hsl(var(--danger));
        }

        .form-error-banner {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: rgba(244, 63, 94, 0.1);
          border: 1px solid rgba(244, 63, 94, 0.2);
          border-radius: var(--radius-sm);
          color: hsl(var(--danger));
          font-size: 0.85rem;
          margin-bottom: 1.5rem;
        }

        .field-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.35rem;
        }

        .voice-mic-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: rgba(15, 118, 110, 0.2);
          border: 1px solid rgba(15, 118, 110, 0.5);
          color: #2dd4bf;
          font-size: 0.75rem;
          padding: 0.25rem 0.55rem;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .voice-mic-btn:hover {
          background: rgba(15, 118, 110, 0.4);
        }

        .voice-mic-btn.listening {
          background: rgba(239, 68, 68, 0.3);
          border-color: #ef4444;
          color: #fca5a5;
          animation: pulse 1.2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .form-row.split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }

        @media (max-width: 480px) {
          .form-row.split {
            grid-template-columns: 1fr;
            gap: 0;
          }
        }

        .patient-details-box {
          background: rgba(15, 23, 42, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: var(--radius-sm);
          padding: 1.25rem;
          margin-bottom: 1.25rem;
        }

        .patient-details-box h4 {
          font-size: 0.95rem;
          color: hsl(var(--text-primary));
          margin-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          padding-bottom: 0.25rem;
        }

        .form-group-checkbox {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          margin: 1.5rem 0;
          padding: 0.75rem;
          background: rgba(244, 63, 94, 0.03);
          border: 1px dashed rgba(244, 63, 94, 0.2);
          border-radius: var(--radius-sm);
        }

        .form-group-checkbox input[type="checkbox"] {
          width: 18px;
          height: 18px;
          margin-top: 0.25rem;
          accent-color: hsl(var(--danger));
          cursor: pointer;
        }

        .form-group-checkbox label {
          cursor: pointer;
        }

        .form-group-checkbox strong {
          display: block;
          font-size: 0.9rem;
          color: hsl(var(--danger));
        }

        .form-group-checkbox span {
          display: block;
          font-size: 0.75rem;
          color: hsl(var(--text-secondary));
          margin-top: 0.15rem;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 1.25rem;
          margin-top: 1.5rem;
        }
      `}</style>
    </div>
  );
}