import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { UserPlus, Mail, User, Shield, MapPin, Key, Copy, Check, AlertCircle, RefreshCw } from 'lucide-react';

export default function RegisterWorker() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'worker',
    village: ''
  });
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingComms, setFetchingComms] = useState(true);
  const [error, setError] = useState('');
  
  // Successful Registration Credentials State
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [copied, setCopied] = useState(false);

  // Load communities for dropdown list
  useEffect(() => {
    async function loadCommunities() {
      try {
        const list = await apiRequest('/communities');
        setCommunities(list);
        if (list.length > 0) {
          setFormData(prev => ({ 
            ...prev, 
            village: prev.role === 'supervisor' ? 'All Districts' : list[0].name 
          }));
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch communities for village assignment.');
      } finally {
        setFetchingComms(false);
      }
    }
    loadCommunities();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'role') {
        if (value === 'supervisor') {
          updated.village = 'All Districts';
        } else {
          updated.village = communities[0]?.name || '';
        }
      }
      return updated;
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setCreatedCredentials(null);

    if (!formData.name.trim()) return setError('Full Name is required.');
    if (!formData.email.trim()) return setError('Email address is required.');
    if (formData.role === 'worker' && !formData.village) return setError('Please assign a primary village.');

    setLoading(true);
    try {
      const response = await apiRequest('/auth/register-worker', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      // Save credentials for secure display panel (AC: send credentials securely)
      setCreatedCredentials({
        name: response.worker.name,
        email: response.worker.email,
        role: response.worker.role,
        village: response.worker.village,
        tempPassword: response.worker.tempPassword
      });

      // Reset Form fields
      setFormData({
        name: '',
        email: '',
        role: 'worker',
        village: communities[0]?.name || ''
      });
    } catch (err) {
      setError(err.message || 'Worker registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = () => {
    if (!createdCredentials) return;
    navigator.clipboard.writeText(createdCredentials.tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="register-worker-page">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Authorized Worker Provisioning</h1>
          <p>Register new community health worker credentials and establish village outreach areas</p>
        </div>
      </div>

      <div className="provisioning-grid">
        {/* Registration Form Card */}
        <div className="glass-panel form-panel-card">
          <div className="card-heading-box">
            <UserPlus className="heading-icon-provision" />
            <h3>Worker Registration Form</h3>
          </div>

          {error && (
            <div className="form-error-banner" style={{ margin: '1rem 0' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="provision-form">
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  placeholder="e.g. Meena Kumari" 
                  className="form-control"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Official Government Email *</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  placeholder="e.g. meena@health.gov.in" 
                  className="form-control"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <span className="input-helper-txt">Assigned credentials will be bound to this official email address.</span>
            </div>

            <div className="form-group">
              <label htmlFor="role">Authorization Role *</label>
              <div className="input-with-icon">
                <Shield size={18} className="input-icon" />
                <select 
                  id="role" 
                  name="role" 
                  className="form-control"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="worker">Health Worker</option>
                  <option value="supervisor">Medical Supervisor</option>
                </select>
              </div>
            </div>

            {formData.role === 'worker' ? (
              <div className="form-group select-village-animate">
                <label htmlFor="village">Assigned Village Beat *</label>
                <div className="input-with-icon">
                  <MapPin size={18} className="input-icon" />
                  {fetchingComms ? (
                    <div className="fetching-loader">
                      <RefreshCw size={14} className="spin" /> Loading villages...
                    </div>
                  ) : (
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
                  )}
                </div>
              </div>
            ) : (
              <div className="form-group select-village-animate">
                <label>Assigned Village Beat</label>
                <div className="input-with-icon">
                  <MapPin size={18} className="input-icon" style={{ color: 'hsl(var(--text-muted))' }} />
                  <input 
                    type="text" 
                    className="form-control" 
                    value="All Districts (Supervisorial)" 
                    disabled 
                    style={{ background: 'rgba(255, 255, 255, 0.02)', color: 'hsl(var(--text-muted))' }}
                  />
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary submit-provision-btn" disabled={loading || (formData.role === 'worker' && fetchingComms)}>
              {loading ? 'Creating Credentials...' : 'Provision Account'}
            </button>
          </form>
        </div>

        {/* Credentials Disclosure Panel */}
        <div className="glass-panel info-panel-card">
          <h3>Secure Credentials Dispatch</h3>
          
          {createdCredentials ? (
            <div className="credentials-disclosure-panel animate-reveal">
              <div className="disclosure-header">
                <Key className="key-glow" />
                <h4>Account Activated Successfully!</h4>
                <p>Deliver the following temporary credentials to the user immediately.</p>
              </div>

              <div className="disclosure-body">
                <div className="cred-line">
                  <span className="label">Registered Name:</span>
                  <span className="value">{createdCredentials.name}</span>
                </div>
                
                <div className="cred-line">
                  <span className="label">Username/Email:</span>
                  <span className="value">{createdCredentials.email}</span>
                </div>

                <div className="cred-line">
                  <span className="label">Authorization Role:</span>
                  <span className="value" style={{ textTransform: 'capitalize' }}>
                    {createdCredentials.role === 'worker' ? 'Health Worker' : 'Medical Supervisor'}
                  </span>
                </div>

                <div className="cred-line">
                  <span className="label">Assigned Beat:</span>
                  <span className="value" style={{ color: 'hsl(var(--primary))', fontWeight: 600 }}>{createdCredentials.village}</span>
                </div>

                <div className="cred-line password-disclose">
                  <div>
                    <span className="label">Temporary Security Password:</span>
                    <span className="value pass-code">{createdCredentials.tempPassword}</span>
                  </div>
                  <button className="copy-btn-action" onClick={handleCopyPassword} title="Copy Password to Clipboard">
                    {copied ? <Check size={18} style={{ color: 'hsl(var(--success))' }} /> : <Copy size={18} />}
                  </button>
                </div>
              </div>

              <div className="disclosure-warnings">
                <strong>🔒 Protocol Security Check</strong>
                <ul>
                  <li>Password must be shared securely via official communication channels.</li>
                  <li>The worker should log in and update their password under their profile settings.</li>
                  <li>Simulated email notification dispatched to: <code>{createdCredentials.email}</code>.</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="disclosure-placeholder">
              <Key size={48} className="key-icon-place" />
              <p>Once you provision a new health worker, their secure temporary credentials and password will be generated and displayed here.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .register-worker-page {
          animation: fadeIn 0.3s ease-out;
        }

        .provisioning-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          align-items: start;
        }

        @media (max-width: 900px) {
          .provisioning-grid {
            grid-template-columns: 1fr;
          }
        }

        .form-panel-card {
          padding: 2rem;
        }

        .card-heading-box {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 1rem;
        }

        .heading-icon-provision {
          color: hsl(var(--primary));
        }

        .provision-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .input-with-icon .input-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: hsl(var(--text-muted));
          pointer-events: none;
        }

        .input-with-icon .form-control {
          padding-left: 2.75rem;
        }

        .fetching-loader {
          padding: 0.75rem 1rem;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-sm);
          color: hsl(var(--text-secondary));
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .fetching-loader .spin {
          animation: spin 1.5s linear infinite;
        }

        .input-helper-txt {
          font-size: 0.7rem;
          color: hsl(var(--text-muted));
          margin-top: 0.25rem;
          display: block;
        }

        .submit-provision-btn {
          margin-top: 1rem;
          padding: 0.85rem;
        }

        .info-panel-card {
          padding: 2rem;
          min-height: 400px;
          display: flex;
          flex-direction: column;
        }

        .info-panel-card h3 {
          font-size: 1.25rem;
          color: hsl(var(--text-primary));
          margin-bottom: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 1rem;
        }

        .disclosure-placeholder {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: hsl(var(--text-secondary));
          padding: 2rem;
        }

        .key-icon-place {
          color: hsl(var(--text-muted));
          margin-bottom: 1rem;
          animation: pulse 2.5s infinite;
        }

        .credentials-disclosure-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .credentials-disclosure-panel.animate-reveal {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .disclosure-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .key-glow {
          color: hsl(var(--success));
          filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.4));
          margin-bottom: 0.5rem;
          animation: bounce 2s infinite alternate;
        }

        @keyframes bounce {
          from { transform: translateY(0); }
          to { transform: translateY(-5px); }
        }

        .disclosure-header h4 {
          color: hsl(var(--success));
          font-size: 1.2rem;
          margin-bottom: 0.25rem;
        }

        .disclosure-header p {
          font-size: 0.8rem;
          color: hsl(var(--text-secondary));
        }

        .disclosure-body {
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: var(--radius-md);
          padding: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .cred-line {
          display: flex;
          justify-content: space-between;
          padding: 0.6rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          font-size: 0.85rem;
        }

        .cred-line:last-child {
          border-bottom: none;
        }

        .cred-line .label {
          color: hsl(var(--text-secondary));
        }

        .cred-line .value {
          color: hsl(var(--text-primary));
          font-weight: 500;
        }

        .password-disclose {
          align-items: center;
          background: rgba(34, 197, 94, 0.04);
          border: 1px dashed rgba(34, 197, 94, 0.2);
          border-radius: var(--radius-sm);
          padding: 0.75rem 1rem;
          margin-top: 0.5rem;
        }

        .pass-code {
          font-family: monospace;
          color: hsl(var(--success)) !important;
          font-size: 1rem;
          background: rgba(0, 0, 0, 0.3);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          display: inline-block;
          margin-top: 0.25rem;
        }

        .copy-btn-action {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: hsl(var(--text-primary));
          width: 38px;
          height: 38px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition-fast);
        }

        .copy-btn-action:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .disclosure-warnings {
          background: rgba(217, 119, 6, 0.05);
          border: 1px solid rgba(217, 119, 6, 0.2);
          border-radius: var(--radius-sm);
          padding: 1rem;
          color: hsl(var(--warning));
          font-size: 0.75rem;
        }

        .disclosure-warnings strong {
          display: block;
          margin-bottom: 0.4rem;
        }

        .disclosure-warnings ul {
          list-style-type: disc;
          padding-left: 1.25rem;
        }

        .disclosure-warnings li {
          margin-bottom: 0.25rem;
        }
      `}</style>
    </div>
  );
}
