import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import { AlertTriangle, CheckCircle, Clock, ShieldCheck, HeartPulse, User, Calendar, MessageSquare, AlertCircle } from 'lucide-react';

export default function Alerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Resolution Modal / Form
  const [resolvingAlert, setResolvingAlert] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadAlerts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest('/cases');
      setAlerts(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch emergency case alerts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleOpenResolve = (alert) => {
    setResolvingAlert(alert);
    setResolutionNotes('');
    setFormError('');
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!resolutionNotes.trim()) {
      return setFormError('Resolution action notes are required to close this critical file.');
    }

    setSaving(true);
    try {
      await apiRequest(`/cases/${resolvingAlert._id}/resolve`, {
        method: 'PUT',
        body: JSON.stringify({ resolutionNotes })
      });
      setResolvingAlert(null);
      loadAlerts();
    } catch (err) {
      setFormError(err.message || 'Failed to submit resolution.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="alerts-page">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Critical Case Alerts</h1>
          <p>Real-time emergency monitoring, triage logs, and medical response tracking</p>
        </div>
      </div>

      <div className="alerts-panel-grid">
        {/* Active Emergency Queue */}
        <div className="glass-panel queue-card">
          <h3>Emergency Case Dispatch Queue</h3>
          
          {alerts.length > 0 ? (
            <div className="alerts-timeline">
              {alerts.map(a => {
                const isPending = a.status === 'pending';
                return (
                  <div key={a._id} className={`alert-card-item ${isPending ? 'pending' : 'resolved'}`}>
                    <div className="alert-card-header">
                      <div className="patient-village-alert">
                        <HeartPulse size={18} className="pulse-icon" />
                        <div>
                          <h4>{a.patientName}</h4>
                          <span>Village: <strong>{a.village}</strong></span>
                        </div>
                      </div>
                      <span className={`badge ${isPending ? 'badge-pending' : 'badge-resolved'}`}>
                        {isPending ? 'PENDING ACTION' : 'RESOLVED'}
                      </span>
                    </div>

                    <div className="alert-card-body">
                      <p className="alert-details-para">{a.details}</p>
                      
                      <div className="alert-meta-details">
                        <span><User size={12} /> Filed by: {a.workerName}</span>
                        <span><Calendar size={12} /> Reported: {new Date(a.createdAt).toLocaleString()}</span>
                      </div>

                      {/* Resolution details show up here if resolved */}
                      {!isPending && (
                        <div className="resolution-feedback-box">
                          <div className="res-header-meta">
                            <ShieldCheck size={14} />
                            <span>Resolved by: <strong>{a.resolvedBy}</strong></span>
                          </div>
                          <p className="res-notes-text">
                            <MessageSquare size={12} className="bubble-icon" />
                            {a.resolutionNotes}
                          </p>
                        </div>
                      )}
                    </div>

                    {isPending && (
                      <div className="alert-card-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => handleOpenResolve(a)}>
                          <CheckCircle size={14} />
                          Formulate Medical Resolution
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-alerts-state">
              <ShieldCheck size={48} className="shield-icon" />
              <p>No critical case alerts logged in the district database. All systems report normal.</p>
            </div>
          )}
        </div>

        {/* Informative instructions card */}
        <div className="glass-panel alert-tips-card">
          <h3>Emergency Case Protocols</h3>
          <div className="protocol-checklist">
            <div className="check-item">
              <Clock size={20} className="check-icon" />
              <div>
                <strong>Triage Response Window</strong>
                <p>Supervisors strive to review critical alerts and coordinate response within 12 hours of field entry logging.</p>
              </div>
            </div>

            <div className="check-item">
              <AlertTriangle size={20} className="check-icon" />
              <div>
                <strong>High-Risk Categories</strong>
                <p>Cases categorized under severe maternal complications, childhood immunization gaps, and respiratory failures receive high priority flags.</p>
              </div>
            </div>

            <div className="check-item">
              <ShieldCheck size={20} className="check-icon" />
              <div>
                <strong>Audited Resolution Logs</strong>
                <p>All supervisor resolution entries are stored persistently in the database logs for state compliance reporting audits.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resolution Submission Modal */}
      {resolvingAlert && (
        <div className="modal-backdrop">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h3>Formulate Critical Resolution</h3>
              <button className="close-btn" onClick={() => setResolvingAlert(null)}>×</button>
            </div>

            {formError && (
              <div className="form-error-banner">
                <AlertCircle size={18} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleResolveSubmit} className="modal-form">
              <div className="alert-summary-box">
                <p><strong>Patient Name:</strong> {resolvingAlert.patientName}</p>
                <p><strong>Village Location:</strong> {resolvingAlert.village}</p>
                <p><strong>Emergency Description:</strong> {resolvingAlert.details}</p>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label htmlFor="resolutionNotes">Medical Response & Action Notes *</label>
                <textarea 
                  id="resolutionNotes" 
                  name="resolutionNotes" 
                  className="form-control"
                  rows="4"
                  placeholder="Describe treatment actions, referrals initiated, hospital admissions scheduled, or medicine dispatched..."
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  required
                ></textarea>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setResolvingAlert(null)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <CheckCircle size={18} />
                  {saving ? 'Closing File...' : 'Resolve Emergency Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .alerts-page {
          animation: fadeIn 0.3s ease-out;
        }

        .alerts-panel-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1.5rem;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .alerts-panel-grid {
            grid-template-columns: 1fr;
          }
        }

        .queue-card {
          padding: 1.5rem;
        }

        .alerts-timeline {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          margin-top: 1.25rem;
        }

        .alert-card-item {
          padding: 1.5rem;
          border-radius: var(--radius-md);
          background: rgba(15, 23, 42, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
          position: relative;
          overflow: hidden;
        }

        .alert-card-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
        }

        .alert-card-item.pending::before {
          background: hsl(var(--danger));
        }

        .alert-card-item.resolved::before {
          background: hsl(var(--success));
        }

        .alert-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
          gap: 1rem;
        }

        .patient-village-alert {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .patient-village-alert h4 {
          font-size: 1.15rem;
          color: hsl(var(--text-primary));
        }

        .patient-village-alert span {
          font-size: 0.75rem;
          color: hsl(var(--text-secondary));
        }

        .pulse-icon {
          color: hsl(var(--danger));
          animation: beat 1.5s infinite;
        }

        .alert-details-para {
          font-size: 0.9rem;
          color: hsl(var(--text-primary));
          background: rgba(0, 0, 0, 0.15);
          padding: 0.75rem 1rem;
          border-radius: var(--radius-sm);
          margin-bottom: 0.75rem;
          border-left: 2px solid rgba(255, 255, 255, 0.05);
        }

        .alert-meta-details {
          display: flex;
          gap: 1.5rem;
          font-size: 0.75rem;
          color: hsl(var(--text-muted));
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .alert-meta-details span {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .resolution-feedback-box {
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(34, 197, 94, 0.05);
          border: 1px solid rgba(34, 197, 94, 0.15);
          border-radius: var(--radius-sm);
        }

        .res-header-meta {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.75rem;
          color: hsl(var(--success));
          margin-bottom: 0.5rem;
        }

        .res-notes-text {
          font-size: 0.85rem;
          color: hsl(var(--text-primary));
          display: flex;
          align-items: flex-start;
          gap: 0.4rem;
          line-height: 1.4;
        }

        .bubble-icon {
          color: hsl(var(--success));
          margin-top: 0.2rem;
          flex-shrink: 0;
        }

        .alert-card-actions {
          display: flex;
          justify-content: flex-end;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
          padding-top: 0.75rem;
        }

        .empty-alerts-state {
          text-align: center;
          padding: 4rem 2rem;
          color: hsl(var(--text-secondary));
        }

        .shield-icon {
          color: hsl(var(--success));
          margin-bottom: 1rem;
          animation: pulse 3s infinite;
        }

        .alert-tips-card {
          padding: 1.5rem;
        }

        .protocol-checklist {
          margin-top: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .check-item {
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
        }

        .check-icon {
          color: hsl(var(--primary));
          margin-top: 0.15rem;
          flex-shrink: 0;
        }

        .check-item strong {
          display: block;
          font-size: 0.9rem;
          color: hsl(var(--text-primary));
          margin-bottom: 0.15rem;
        }

        .check-item p {
          font-size: 0.75rem;
          color: hsl(var(--text-secondary));
          line-height: 1.4;
        }

        .alert-summary-box {
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 1rem;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
        }

        .alert-summary-box p {
          margin-bottom: 0.4rem;
        }

        .alert-summary-box p:last-child {
          margin-bottom: 0;
          color: hsl(var(--danger));
        }
      `}</style>
    </div>
  );
}
