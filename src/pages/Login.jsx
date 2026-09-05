import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import { Shield, User, Heart, Lock, Mail, ChevronRight, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login, register, token } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState('worker'); // 'worker' or 'supervisor'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    village: 'Rampur'
  });
  const [communities, setCommunities] = useState([
    { name: 'Rampur' }, { name: 'Karanpur' }, { name: 'Gopalpur' }, { name: 'Sonpur' }, { name: 'Bihta' }
  ]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to home
  useEffect(() => {
    if (token) {
      navigate('/');
    }
  }, [token, navigate]);

  // Load villages dynamically
  useEffect(() => {
    async function fetchVillages() {
      try {
        const list = await apiRequest('/communities');
        if (list && list.length > 0) {
          setCommunities(list);
          setFormData(prev => ({ ...prev, village: list[0].name }));
        }
      } catch (err) {
        console.warn("Could not fetch communities for login, using defaults.");
      }
    }
    fetchVillages();
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        // Validation
        if (!formData.name.trim()) throw new Error('Full Name is required.');
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        if (formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        await register(
          formData.name,
          formData.email,
          formData.password,
          role,
          role === 'worker' ? formData.village : 'All Districts'
        );
      } else {
        await login(formData.email, formData.password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      {/* Background visual circles */}
      <div className="glow-circle top-right"></div>
      <div className="glow-circle bottom-left"></div>

      <div className="login-card glass-panel">
        <div className="brand-badge">
          <Heart size={28} className="heart-pulse-icon" />
          <h1>Sanjeevani</h1>
          <p>Rural Health Security Portal</p>
        </div>

        {/* Tab Selection */}
        <div className="tab-buttons">
          <button 
            type="button" 
            className={`tab-btn ${!isRegister ? 'active' : ''}`}
            onClick={() => { setIsRegister(false); setError(''); }}
          >
            Log In
          </button>
          <button 
            type="button" 
            className={`tab-btn ${isRegister ? 'active' : ''}`}
            onClick={() => { setIsRegister(true); setError(''); }}
          >
            Register
          </button>
        </div>

        {!isRegister && (
          <div className="quick-autofill-container">
            <span className="autofill-label">Quick Demo Access:</span>
            <div className="autofill-buttons">
              <button
                type="button"
                className="autofill-btn supervisor"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    email: 'supervisor@health.gov.in',
                    password: 'password123'
                  }));
                }}
              >
                <Shield size={14} /> Supervisor
              </button>
              <button
                type="button"
                className="autofill-btn worker"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    email: 'worker1@health.gov.in',
                    password: 'password123'
                  }));
                }}
              >
                <User size={14} /> Health Worker
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Register-only fields */}
          {isRegister && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input 
                  type="text" 
                  id="name"
                  name="name" 
                  className="form-control"
                  placeholder="e.g. Sunita Devi"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Official Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input 
                type="email" 
                id="email" 
                name="email"
                className="form-control"
                placeholder="e.g. name@health.gov.in"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Security Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input 
                type="password" 
                id="password" 
                name="password"
                className="form-control"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Register-only confirm password */}
          {isRegister && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Security Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input 
                  type="password" 
                  id="confirmPassword" 
                  name="confirmPassword"
                  className="form-control"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          )}

          {/* Role Differentiated Registration Setup */}
          {isRegister && (
            <div className="role-setup-container">
              <label>Select Authorization Role</label>
              <div className="role-selector-grid">
                <div 
                  className={`role-choice-box ${role === 'worker' ? 'selected' : ''}`}
                  onClick={() => setRole('worker')}
                >
                  <User size={20} />
                  <div>
                    <strong>Health Worker</strong>
                    <span>Logs community field visits</span>
                  </div>
                </div>
                
                <div 
                  className={`role-choice-box ${role === 'supervisor' ? 'selected' : ''}`}
                  onClick={() => setRole('supervisor')}
                >
                  <Shield size={20} />
                  <div>
                    <strong>Supervisor</strong>
                    <span>Analyzes district statistics</span>
                  </div>
                </div>
              </div>

              {/* Village Selection only for health workers */}
              {role === 'worker' && (
                <div className="form-group select-village-animate">
                  <label htmlFor="village">Assigned Primary Village</label>
                  <select 
                    id="village" 
                    name="village"
                    className="form-control"
                    value={formData.village}
                    onChange={handleChange}
                  >
                    {communities.map((c, i) => (
                      <option key={i} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-submit-auth" disabled={loading}>
            {loading ? 'Processing Securing Auth...' : (isRegister ? 'Complete Registration' : 'Secure Login')}
            <ChevronRight size={18} />
          </button>
        </form>

        <div className="login-footer">
          <p>Authorized personnel only. Activities are audited for patient privacy protection.</p>
          <div className="pre-filled-accounts">
            <span>Demo logins (password: <strong>password123</strong>):</span>
            <ul>
              <li>Supervisor: <code>supervisor@health.gov.in</code></li>
              <li>Worker: <code>worker1@health.gov.in</code></li>
            </ul>
          </div>
        </div>
      </div>

      <style>{`
        .login-page-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 2rem;
          overflow: hidden;
          background: #06090e;
        }

        .glow-circle {
          position: absolute;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.12;
          pointer-events: none;
        }

        .glow-circle.top-right {
          top: -100px;
          right: -100px;
          background: hsl(var(--primary));
        }

        .glow-circle.bottom-left {
          bottom: -100px;
          left: -100px;
          background: hsl(var(--accent));
        }

        .login-card {
          width: 100%;
          max-width: 460px;
          padding: 2.5rem;
          background: rgba(30, 41, 59, 0.4) !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }

        .brand-badge {
          text-align: center;
          margin-bottom: 2rem;
        }

        .heart-pulse-icon {
          color: hsl(var(--primary));
          margin-bottom: 0.5rem;
          animation: beat 2s infinite;
        }

        @keyframes beat {
          0%, 100% { transform: scale(1); }
          30% { transform: scale(1.15); }
          50% { transform: scale(1.05); }
          65% { transform: scale(1.15); }
        }

        .brand-badge h1 {
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #14b8a6 0%, #10b981 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .brand-badge p {
          color: hsl(var(--text-secondary));
          font-size: 0.85rem;
          margin-top: 0.25rem;
        }

        .tab-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: rgba(15, 23, 42, 0.5);
          border-radius: var(--radius-sm);
          padding: 0.3rem;
          border: 1px solid rgba(255, 255, 255, 0.04);
          margin-bottom: 2rem;
        }

        .tab-btn {
          background: none;
          border: none;
          color: hsl(var(--text-secondary));
          padding: 0.6rem;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          border-radius: 4px;
          transition: var(--transition-fast);
        }

        .tab-btn.active {
          color: hsl(var(--bg-secondary));
          background: hsl(var(--primary));
          box-shadow: var(--shadow-sm);
        }

        .error-banner {
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

        .input-with-icon {
          position: relative;
        }

        .input-icon {
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

        .role-setup-container {
          margin: 1.5rem 0;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 1.25rem;
        }

        .role-setup-container > label {
          display: block;
          font-size: 0.8rem;
          color: hsl(var(--text-secondary));
          margin-bottom: 0.75rem;
        }

        .role-selector-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }

        .role-choice-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 1rem;
          background: rgba(15, 23, 42, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: var(--transition-normal);
        }

        .role-choice-box svg {
          color: hsl(var(--text-muted));
          margin-bottom: 0.5rem;
          transition: var(--transition-fast);
        }

        .role-choice-box strong {
          display: block;
          font-size: 0.85rem;
          color: hsl(var(--text-primary));
        }

        .role-choice-box span {
          display: block;
          font-size: 0.65rem;
          color: hsl(var(--text-secondary));
          margin-top: 0.2rem;
        }

        .role-choice-box:hover {
          border-color: rgba(255, 255, 255, 0.15);
          background: rgba(15, 23, 42, 0.6);
        }

        .role-choice-box.selected {
          border-color: hsl(var(--primary));
          background: rgba(20, 184, 166, 0.08);
          box-shadow: 0 0 10px rgba(20, 184, 166, 0.1);
        }

        .role-choice-box.selected svg {
          color: hsl(var(--primary));
        }

        .select-village-animate {
          animation: slideDown 0.25s ease-out forwards;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .btn-submit-auth {
          width: 100%;
          margin-top: 1.5rem;
          padding: 0.9rem;
        }

        .login-footer {
          margin-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 1rem;
          text-align: center;
        }

        .login-footer p {
          font-size: 0.7rem;
          color: hsl(var(--text-muted));
        }

        .pre-filled-accounts {
          margin-top: 0.75rem;
          font-size: 0.75rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: var(--radius-sm);
          padding: 0.5rem;
          text-align: left;
        }

        .pre-filled-accounts span {
          display: block;
          color: hsl(var(--text-secondary));
          margin-bottom: 0.25rem;
        }

        .pre-filled-accounts ul {
          list-style: none;
        }

        .pre-filled-accounts li {
          color: hsl(var(--text-primary));
          margin-bottom: 0.15rem;
        }
        
        .pre-filled-accounts code {
          background: rgba(0, 0, 0, 0.3);
          padding: 0.1rem 0.3rem;
          border-radius: 3px;
          color: hsl(var(--primary));
        }

        .quick-autofill-container {
          margin-bottom: 1.5rem;
          padding: 0.8rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-sm);
        }

        .autofill-label {
          display: block;
          font-size: 0.75rem;
          color: hsl(var(--text-secondary));
          margin-bottom: 0.5rem;
          text-align: center;
          font-weight: 500;
        }

        .autofill-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .autofill-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          padding: 0.5rem;
          font-size: 0.8rem;
          font-weight: 600;
          border-radius: 4px;
          cursor: pointer;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: hsl(var(--text-primary));
          transition: var(--transition-fast);
        }

        .autofill-btn:hover {
          background: rgba(15, 23, 42, 0.8);
          border-color: hsla(var(--primary), 0.5);
        }

        .autofill-btn.supervisor:hover {
          box-shadow: 0 0 8px rgba(129, 140, 248, 0.2);
          border-color: hsl(var(--accent));
          color: hsl(var(--accent));
        }

        .autofill-btn.worker:hover {
          box-shadow: 0 0 8px rgba(20, 184, 166, 0.2);
          border-color: hsl(var(--primary));
          color: hsl(var(--primary));
        }
      `}</style>
    </div>
  );
}
