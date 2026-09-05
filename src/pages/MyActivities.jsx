import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest, getDemoModeStatus } from '../utils/api';
import ActivityForm from '../components/ActivityForm';
import { Plus, Edit, Trash2, Calendar, FileText, Search, CheckCircle, AlertTriangle, Download } from 'lucide-react';

export default function MyActivities() {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [communities, setCommunities] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);

  // Search/Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const loadActivities = async () => {
    setLoading(true);
    setError('');
    try {
      const logs = await apiRequest('/activities');
      setActivities(logs);
      
      const comms = await apiRequest('/communities');
      setCommunities(comms);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch activity logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleSaveActivity = async (formData) => {
    try {
      if (selectedActivity) {
        await apiRequest(`/activities/${selectedActivity._id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        triggerToast('Activity log updated.');
      } else {
        await apiRequest('/activities', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        triggerToast('Activity logged successfully.');
      }
      setIsModalOpen(false);
      setSelectedActivity(null);
      loadActivities();
    } catch (err) {
      throw new Error(err.message || 'Error saving activity.');
    }
  };

  const handleDeleteActivity = async (id) => {
    if (!window.confirm('Delete this activity log? This will also clear any linked urgent supervisor alerts.')) return;
    try {
      await apiRequest(`/activities/${id}`, { method: 'DELETE' });
      triggerToast('Activity log removed.');
      loadActivities();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleEditClick = (act) => {
    setSelectedActivity(act);
    setIsModalOpen(true);
  };

  const handleExportCSV = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filterStartDate) queryParams.append('startDate', filterStartDate);
      if (filterEndDate) queryParams.append('endDate', filterEndDate);
      if (filterType) queryParams.append('type', filterType);
      
      const response = await apiRequest(`/reports/export/csv?${queryParams.toString()}`);
      
      let csvContent = "";
      if (response && response.isMockCsv) {
        csvContent = response.csvData;
      } else if (response instanceof Blob) {
        csvContent = await response.text();
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `my_health_activity_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('CSV export failed: ' + err.message);
    }
  };

  const handleExportPDF = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filterStartDate) queryParams.append('startDate', filterStartDate);
      if (filterEndDate) queryParams.append('endDate', filterEndDate);
      if (filterType) queryParams.append('type', filterType);

      const isDemo = getDemoModeStatus();
      if (isDemo) {
        // Mock Mode: open local Blob HTML document
        const response = await apiRequest(`/reports/export/pdf?${queryParams.toString()}`);
        const blob = new Blob([response.htmlData], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } else {
        // Live Mode: direct token URL link redirection
        const token = localStorage.getItem('sh_token');
        queryParams.append('token', token);
        window.open(`http://localhost:5000/api/reports/export/pdf?${queryParams.toString()}`, '_blank');
      }
    } catch (err) {
      alert('PDF generation failed: ' + err.message);
    }
  };

  const filteredActivities = activities.filter(a => {
    const matchesSearch = 
      (a.patientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.details || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.outcome || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType ? a.type === filterType : true;
    const matchesStartDate = filterStartDate ? a.date >= filterStartDate : true;
    const matchesEndDate = filterEndDate ? a.date <= filterEndDate : true;
    
    return matchesSearch && matchesType && matchesStartDate && matchesEndDate;
  });

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="my-activities-page">
      {/* Toast Notification */}
      {toast && (
        <div className="toast glass-panel" style={{ borderLeft: '4px solid hsl(var(--primary))' }}>
          <CheckCircle size={18} style={{ color: 'hsl(var(--primary))' }} />
          <span>{toast}</span>
        </div>
      )}

      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>My Field Activity Database</h1>
          <p>Search, review, edit, and delete your logged community service entries</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handleExportPDF}>
            <FileText size={18} />
            <span>Print PDF</span>
          </button>
          
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={18} />
            <span>Export CSV</span>
          </button>
          
          <button className="btn btn-primary" onClick={() => { setSelectedActivity(null); setIsModalOpen(true); }}>
            <Plus size={18} />
            <span>Log Field Activity</span>
          </button>
        </div>
      </div>

      <div className="glass-panel logs-table-card">
        <div className="log-section-header">
          <h3>Logged Field Outreaches</h3>
          
          <div className="table-filters-container">
            <div className="search-box">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Search by patient, details, or outcome..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <select 
              value={filterType} 
              onChange={e => setFilterType(e.target.value)}
              className="select-type-filter"
            >
              <option value="">All Services</option>
              <option value="visit">Home Visits</option>
              <option value="intervention">Clinical Interventions</option>
              <option value="training">Health Trainings</option>
            </select>

            <div className="filter-item">
              <span style={{ fontSize: '0.75rem', marginRight: '4px' }}>From:</span>
              <input 
                type="date" 
                value={filterStartDate} 
                onChange={e => setFilterStartDate(e.target.value)} 
                className="filter-date-input"
              />
            </div>

            <div className="filter-item">
              <span style={{ fontSize: '0.75rem', marginRight: '4px' }}>To:</span>
              <input 
                type="date" 
                value={filterEndDate} 
                onChange={e => setFilterEndDate(e.target.value)} 
                className="filter-date-input"
              />
            </div>
          </div>
        </div>

        <div className="table-container">
          {filteredActivities.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Service Type</th>
                  <th>Patient Info</th>
                  <th>Outreach Details Summary</th>
                  <th>Referral/Outcome</th>
                  <th>Alert Level</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map(a => (
                  <tr key={a._id}>
                    <td>
                      <div className="date-cell">
                        <Calendar size={14} />
                        <span>{new Date(a.date).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${a.type}`}>{a.type.toUpperCase()}</span>
                    </td>
                    <td>
                      {a.type === 'training' ? (
                        <span className="muted-text">N/A</span>
                      ) : (
                        <div>
                          <strong>{a.patientName}</strong>
                          <br />
                          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>
                            {a.patientAge} yrs / {a.patientGender}
                          </span>
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="cell-details-wrapper" title={a.details}>
                        {a.details}
                      </div>
                    </td>
                    <td>
                      <div className="cell-outcome-wrapper text-outcome" title={a.outcome}>
                        {a.outcome}
                      </div>
                    </td>
                    <td>
                      {a.isUrgent ? (
                        <span className="badge badge-pending">
                          <AlertTriangle size={10} style={{ marginRight: '3px' }} />
                          CRITICAL
                        </span>
                      ) : (
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.03)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>ROUTINE</span>
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="action-icon-btn edit" onClick={() => handleEditClick(a)}>
                          <Edit size={16} />
                        </button>
                        <button className="action-icon-btn delete" onClick={() => handleDeleteActivity(a._id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="table-empty">
              <FileText size={40} />
              <p>No activity logs match your search filters.</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <ActivityForm 
          activity={selectedActivity}
          communities={communities}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveActivity}
        />
      )}

      <style>{`
        .my-activities-page {
          animation: fadeIn 0.3s ease-out;
        }

        .logs-table-card {
          padding: 1.5rem;
        }

        .date-cell {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          white-space: nowrap;
          color: hsl(var(--text-secondary));
        }

        .date-cell svg {
          color: hsl(var(--primary));
        }

        .cell-details-wrapper, .cell-outcome-wrapper {
          max-width: 250px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 0.8rem;
        }

        .row-actions {
          display: flex;
          gap: 0.25rem;
        }

        .muted-text {
          color: hsl(var(--text-muted));
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
}
