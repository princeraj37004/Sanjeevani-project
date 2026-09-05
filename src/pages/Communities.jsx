import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import CommunityMap from '../components/CommunityMap';
import { MapPin, Plus, Search, Map, Globe, ShieldAlert, AlertCircle, Save } from 'lucide-react';

export default function Communities() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add Village Form Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    district: 'Patna',
    population: '',
    healthWorker: 'Unassigned',
    lat: '',
    lng: ''
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Search/Filter
  const [searchQuery, setSearchQuery] = useState('');

  const loadCommunitiesData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch community analytics
      const stats = await apiRequest('/communities/stats');
      setCommunities(stats);
    } catch (err) {
      console.error(err);
      setError('Failed to load community directory and geo-coordinates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommunitiesData();
  }, []);

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddCommunity = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!formData.name.trim()) return setFormError('Village name is required.');
    if (!formData.population || Number(formData.population) <= 0) return setFormError('Population must be greater than zero.');
    if (!formData.lat || !formData.lng) return setFormError('Coordinates are required for geo-tagging.');

    setSaving(true);
    try {
      await apiRequest('/communities', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      // Reset & Reload
      setFormData({
        name: '',
        district: 'Patna',
        population: '',
        healthWorker: 'Unassigned',
        lat: '',
        lng: ''
      });
      setIsFormOpen(false);
      loadCommunitiesData();
    } catch (err) {
      setFormError(err.message || 'Failed to save community.');
    } finally {
      setSaving(false);
    }
  };

  const filteredCommunities = communities.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.healthWorker.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="communities-page">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Community Directory & Geo-Tagging</h1>
          <p>Register villages, map coordinates, assign staff, and audit coverage gaps</p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsFormOpen(true)}>
          <Plus size={18} />
          <span>Register New Village</span>
        </button>
      </div>

      {/* SVG Interactive Map */}
      <CommunityMap communities={communities} />

      {/* Village Directory List */}
      <div className="glass-panel directory-section">
        <div className="directory-header-controls">
          <h3>Tracked Villages & Coverage Index</h3>
          
          <div className="search-box">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search villages, workers, or districts..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Village/Community Name</th>
                <th>District</th>
                <th>Population</th>
                <th>Geo Coordinates</th>
                <th>Assigned Worker</th>
                <th>Total Service Logs</th>
                <th>Coverage Gap Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredCommunities.map(c => {
                // Determine coverage classification
                let coverageClass = "high";
                let coverageLabel = "Excellent";
                if (c.pendingAlertsCount > 0) {
                  coverageClass = "urgent";
                  coverageLabel = "Critical Case Active";
                } else if (c.activityCount >= 10) {
                  coverageClass = "high";
                  coverageLabel = "Sufficient Outreach";
                } else if (c.activityCount >= 3) {
                  coverageClass = "moderate";
                  coverageLabel = "Moderate Coverage";
                } else {
                  coverageClass = "underserved";
                  coverageLabel = "Underserved Gap";
                }

                return (
                  <tr key={c._id}>
                    <td>
                      <div className="village-name-cell">
                        <MapPin size={16} />
                        <strong>{c.name}</strong>
                      </div>
                    </td>
                    <td>{c.district}</td>
                    <td>{Number(c.population || 0).toLocaleString()}</td>
                    <td>
                      <code className="coords-code">{Number(c.lat || 0).toFixed(4)}° N, {Number(c.lng || 0).toFixed(4)}° E</code>
                    </td>
                    <td>{c.healthWorker}</td>
                    <td>{c.activityCount}</td>
                    <td>
                      <span className={`badge-coverage ${coverageClass}`}>{coverageLabel}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register New Village Modal */}
      {isFormOpen && (
        <div className="modal-backdrop">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h3>Register New Village / Community</h3>
              <button className="close-btn" onClick={() => setIsFormOpen(false)}>×</button>
            </div>

            {formError && (
              <div className="form-error-banner">
                <AlertCircle size={18} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddCommunity} className="modal-form">
              <div className="form-group">
                <label htmlFor="name">Village Name *</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  className="form-control"
                  placeholder="e.g. Sonpur"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row split">
                <div className="form-group">
                  <label htmlFor="district">District *</label>
                  <input 
                    type="text" 
                    id="district" 
                    name="district" 
                    className="form-control"
                    placeholder="e.g. Patna"
                    value={formData.district}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="population">Population *</label>
                  <input 
                    type="number" 
                    id="population" 
                    name="population" 
                    className="form-control"
                    placeholder="e.g. 1500"
                    value={formData.population}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="patient-details-box">
                <h4>Geo-Tag Coordinates</h4>
                <div className="form-row split">
                  <div className="form-group">
                    <label htmlFor="lat">Latitude *</label>
                    <input 
                      type="number" 
                      step="any"
                      id="lat" 
                      name="lat" 
                      className="form-control"
                      placeholder="e.g. 25.5941"
                      value={formData.lat}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="lng">Longitude *</label>
                    <input 
                      type="number" 
                      step="any"
                      id="lng" 
                      name="lng" 
                      className="form-control"
                      placeholder="e.g. 85.1376"
                      value={formData.lng}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <span className="form-note">Coordinates map directly onto the interactive geo-map.</span>
              </div>

              <div className="form-group">
                <label htmlFor="healthWorker">Assigned Health Worker</label>
                <input 
                  type="text" 
                  id="healthWorker" 
                  name="healthWorker" 
                  className="form-control"
                  placeholder="e.g. Sunita Devi (or leave Unassigned)"
                  value={formData.healthWorker}
                  onChange={handleInputChange}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Save size={18} />
                  {saving ? 'Registering...' : 'Register Village'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .communities-page {
          animation: fadeIn 0.3s ease-out;
        }

        .directory-section {
          padding: 1.5rem;
        }

        .directory-header-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .village-name-cell {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .village-name-cell svg {
          color: hsl(var(--primary));
        }

        .coords-code {
          background: rgba(255, 255, 255, 0.05);
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          color: hsl(var(--accent));
          font-family: monospace;
          font-size: 0.8rem;
        }

        .badge-coverage {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.6rem;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: var(--radius-full);
        }

        .badge-coverage.high { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
        .badge-coverage.moderate { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); }
        .badge-coverage.underserved { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }
        .badge-coverage.urgent { 
          background: rgba(244, 63, 94, 0.15); 
          color: #f43f5e; 
          border: 1px solid rgba(244, 63, 94, 0.3);
          animation: mapPulse 1.5s infinite alternate; 
        }

        .form-note {
          display: block;
          font-size: 0.7rem;
          color: hsl(var(--text-muted));
          margin-top: 0.4rem;
        }

        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(4, 6, 10, 0.8);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
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
          background: rgba(30, 41, 59, 0.95) !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          border-radius: var(--radius-md);
          padding: 2rem;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
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
          font-size: 1.5rem;
          cursor: pointer;
          transition: var(--transition-fast);
          line-height: 1;
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
          background: rgba(15, 23, 42, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: var(--radius-sm);
          padding: 1.25rem;
          margin-bottom: 1.25rem;
        }

        .patient-details-box h4 {
          font-size: 0.85rem;
          color: hsl(var(--primary));
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
}
