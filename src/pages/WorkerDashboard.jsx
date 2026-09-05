import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import StatsCard from '../components/StatsCard';
import ActivityForm from '../components/ActivityForm';
import { 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Users, 
  Activity as ActivityIcon, 
  AlertTriangle, 
  Search,
  Calendar,
  CheckCircle,
  Clock
} from 'lucide-react';

export default function WorkerDashboard() {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [myVillageInfo, setMyVillageInfo] = useState(null);
  const [pendingAlertsCount, setPendingAlertsCount] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);

  // Search/Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');

  const loadWorkerData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch communities list
      const comms = await apiRequest('/communities');
      setCommunities(comms);

      // Find current worker's village details
      const myVillage = comms.find(c => c.name.toLowerCase() === user?.village?.toLowerCase());
      if (myVillage) {
        setMyVillageInfo(myVillage);
      }

      // 2. Fetch worker's specific activities
      const logs = await apiRequest('/activities');
      setActivities(logs);

      // 3. Fetch village alerts
      const alerts = await apiRequest('/cases');
      const villagePending = alerts.filter(a => a.village === user?.village && a.status === 'pending');
      setPendingAlertsCount(villagePending.length);

    } catch (err) {
      console.error(err);
      setError('Failed to fetch field worker dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadWorkerData();
    }
  }, [user]);

  // Show status popup
  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // CRUD: CREATE / UPDATE
  const handleSaveActivity = async (formData) => {
    try {
      if (selectedActivity) {
        // UPDATE
        await apiRequest(`/activities/${selectedActivity._id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        triggerToast('Activity log updated successfully.');
      } else {
        // CREATE
        await apiRequest('/activities', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        triggerToast('Activity logged successfully.');
      }
      setIsModalOpen(false);
      setSelectedActivity(null);
      loadWorkerData();
    } catch (err) {
      throw new Error(err.message || 'Error saving activity log.');
    }
  };

  // CRUD: DELETE
  const handleDeleteActivity = async (id) => {
    if (!window.confirm('Are you sure you want to delete this activity log? This will also remove any linked emergency case alerts.')) return;
    
    try {
      await apiRequest(`/activities/${id}`, {
        method: 'DELETE'
      });
      triggerToast('Activity entry deleted.');
      loadWorkerData();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleEditClick = (act) => {
    setSelectedActivity(act);
    setIsModalOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedActivity(null);
    setIsModalOpen(true);
  };

  // Search & Type filter logic
  const filteredActivities = activities.filter(a => {
    const matchesSearch = 
      (a.patientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.details || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.outcome || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType ? a.type === filterType : true;
    return matchesSearch && matchesType;
  });

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="worker-dashboard-container">
      {/* Toast Notification */}
      {toast && (
        <div className="toast glass-panel" style={{ borderLeft: '4px solid hsl(var(--primary))' }}>
          <CheckCircle size={18} style={{ color: 'hsl(var(--primary))' }} />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Welcome, {user?.name}</h1>
          <p>Assigned Village Area: <strong>{user?.village}</strong></p>
        </div>

        <button className="btn btn-primary" onClick={handleCreateClick}>
          <Plus size={18} />
          <span>Log Field Activity</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <StatsCard 
          title="My Total Activities Logged" 
          value={activities.length} 
          icon={ActivityIcon}
          variant="primary"
        />
        <StatsCard 
          title="Village Population" 
          value={myVillageInfo ? myVillageInfo.population.toLocaleString() : 'N/A'} 
          icon={Users}
          variant="info"
        />
        <StatsCard 
          title="Active Critical Alerts" 
          value={pendingAlertsCount} 
          icon={AlertTriangle}
          variant={pendingAlertsCount > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* Main Grid: My Logs & Info */}
      <div className="worker-grid">
        {/* Logs List */}
        <div className="glass-panel logs-list-card">
          <div className="card-header-logs">
            <h3>My Daily Action Logs ({filteredActivities.length})</h3>
            
            <div className="log-controls">
              <div className="search-box">
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Search logs..." 
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
            </div>
          </div>

          <div className="logs-scroller">
            {filteredActivities.length > 0 ? (
              <div className="activities-custom-list">
                {filteredActivities.map(act => (
                  <div key={act._id} className="activity-custom-item glass-panel">
                    <div className="item-header">
                      <div className="type-date">
                        <span className={`badge badge-${act.type}`}>{act.type.toUpperCase()}</span>
                        <span className="item-date">
                          <Calendar size={12} />
                          {new Date(act.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="item-actions">
                        <button className="action-icon-btn edit" onClick={() => handleEditClick(act)} title="Edit Entry">
                          <Edit size={16} />
                        </button>
                        <button className="action-icon-btn delete" onClick={() => handleDeleteActivity(act._id)} title="Delete Entry">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="item-body">
                      {act.type !== 'training' && (
                        <p className="patient-meta">
                          Patient: <strong>{act.patientName}</strong> ({act.patientAge} yrs / {act.patientGender})
                        </p>
                      )}
                      <p className="item-text"><strong>Details:</strong> {act.details}</p>
                      <p className="item-text text-outcome"><strong>Outcome:</strong> {act.outcome}</p>
                    </div>

                    <div className="item-footer">
                      {act.isUrgent ? (
                        <span className="badge badge-pending">
                          <AlertTriangle size={12} />
                          CRITICAL CASE REPORTED
                        </span>
                      ) : (
                        <span className="routine-badge">Routine Case</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-logs-placeholder">
                <ActivityIcon size={40} className="empty-icon" />
                <p>No activity logs recorded. Click "Log Field Activity" above to create your first daily report.</p>
              </div>
            )}
          </div>
        </div>

        {/* Village Community Sidebar Card */}
        <div className="glass-panel village-sidebar">
          <h3>My Community Profile</h3>
          {myVillageInfo ? (
            <div className="village-profile-details">
              <div className="village-header-map">
                <MapPin size={24} className="map-pin-icon" />
                <div>
                  <h4>{myVillageInfo.name}</h4>
                  <span>{myVillageInfo.district} District</span>
                </div>
              </div>
              
              <div className="profile-stat-box">
                <div className="stat-line">
                  <span>Registered Population</span>
                  <strong>{myVillageInfo.population.toLocaleString()}</strong>
                </div>
                <div className="stat-line">
                  <span>Geo-Tags</span>
                  <span>{myVillageInfo.lat.toFixed(4)}° N, {myVillageInfo.lng.toFixed(4)}° E</span>
                </div>
              </div>

              <div className="alert-status-block">
                <h5>Critical Status Alerts</h5>
                {pendingAlertsCount > 0 ? (
                  <div className="alert-alert active">
                    <AlertTriangle size={18} />
                    <div>
                      <strong>{pendingAlertsCount} Unresolved Alert(s)</strong>
                      <p>Supervisors have been notified and cases are pending medical review.</p>
                    </div>
                  </div>
                ) : (
                  <div className="alert-alert resolved-safe">
                    <CheckCircle size={18} />
                    <div>
                      <strong>No Pending Emergency cases</strong>
                      <p>All logged critical incidents have been successfully resolved.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="help-box-worker">
                <h5>Guidelines for Logs</h5>
                <ul>
                  <li>Always record outcomes immediately following patient consultations.</li>
                  <li>Flag as "Critical Case" only if the patient requires supervisor review or referral to a district hospital.</li>
                  <li>Ensure patient names are correctly spelt.</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="no-village-linked">
              <MapPin size={32} />
              <p>No active village profile linked to your account. Edit your registration or contact your District Supervisor.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <ActivityForm 
          activity={selectedActivity}
          communities={communities}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveActivity}
        />
      )}

      <style>{`
        .worker-dashboard-container {
          animation: fadeIn 0.3s ease-out;
        }

        .worker-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1.5rem;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .worker-grid {
            grid-template-columns: 1fr;
          }
        }

        .logs-list-card {
          padding: 1.5rem;
        }

        .card-header-logs {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .log-controls {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(15, 23, 42, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-sm);
          padding: 0.4rem 0.75rem;
          font-size: 0.85rem;
        }

        .search-box input {
          background: none;
          border: none;
          color: hsl(var(--text-primary));
          outline: none;
          width: 150px;
        }

        .select-type-filter {
          background: rgba(15, 23, 42, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-sm);
          padding: 0.4rem 0.75rem;
          color: hsl(var(--text-primary));
          outline: none;
          cursor: pointer;
        }

        .select-type-filter option {
          background: hsl(var(--card-bg));
        }

        .logs-scroller {
          max-height: 600px;
          overflow-y: auto;
          padding-right: 0.25rem;
        }

        .activities-custom-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .activity-custom-item {
          padding: 1.25rem;
          background: rgba(255, 255, 255, 0.02) !important;
          border-color: rgba(255, 255, 255, 0.05) !important;
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .type-date {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .item-date {
          font-size: 0.75rem;
          color: hsl(var(--text-secondary));
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .item-actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-icon-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.3rem;
          border-radius: 4px;
          color: hsl(var(--text-secondary));
          transition: var(--transition-fast);
        }

        .action-icon-btn.edit:hover {
          color: hsl(var(--primary));
          background: rgba(20, 184, 166, 0.1);
        }

        .action-icon-btn.delete:hover {
          background: rgba(244, 63, 94, 0.1);
          color: hsl(var(--danger));
        }

        .patient-meta {
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
          color: hsl(var(--text-secondary));
        }

        .item-text {
          font-size: 0.85rem;
          line-height: 1.4;
          margin-bottom: 0.25rem;
        }

        .text-outcome {
          color: hsl(var(--primary));
        }

        .item-footer {
          margin-top: 0.75rem;
          border-top: 1px solid rgba(255, 255, 255, 0.03);
          padding-top: 0.5rem;
        }

        .routine-badge {
          font-size: 0.7rem;
          color: hsl(var(--text-muted));
        }

        .empty-logs-placeholder {
          text-align: center;
          padding: 3rem;
          color: hsl(var(--text-secondary));
        }

        .empty-logs-placeholder svg {
          color: hsl(var(--text-muted));
          margin-bottom: 1rem;
        }

        .village-sidebar {
          padding: 1.5rem;
        }

        .village-header-map {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 1.25rem 0;
        }

        .map-pin-icon {
          color: hsl(var(--primary));
        }

        .village-header-map h4 {
          font-size: 1.25rem;
          color: hsl(var(--text-primary));
        }

        .village-header-map span {
          font-size: 0.75rem;
          color: hsl(var(--text-secondary));
        }

        .profile-stat-box {
          background: rgba(15, 23, 42, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-sm);
          padding: 1rem;
          margin-bottom: 1.5rem;
        }

        .stat-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8rem;
          margin-bottom: 0.5rem;
        }

        .stat-line:last-child {
          margin-bottom: 0;
        }

        .alert-status-block h5 {
          font-size: 0.85rem;
          color: hsl(var(--text-secondary));
          margin-bottom: 0.75rem;
        }

        .alert-alert {
          display: flex;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
        }

        .alert-alert.active {
          background: rgba(244, 63, 94, 0.08);
          border: 1px solid rgba(244, 63, 94, 0.2);
          color: hsl(var(--danger));
        }

        .alert-alert.resolved-safe {
          background: rgba(34, 197, 94, 0.08);
          border: 1px solid rgba(34, 197, 94, 0.2);
          color: hsl(var(--success));
        }

        .alert-alert p {
          color: hsl(var(--text-secondary));
          margin-top: 0.1rem;
        }

        .help-box-worker {
          margin-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 1rem;
        }

        .help-box-worker h5 {
          font-size: 0.85rem;
          color: hsl(var(--text-secondary));
          margin-bottom: 0.5rem;
        }

        .help-box-worker ul {
          list-style-type: disc;
          padding-left: 1.25rem;
          font-size: 0.75rem;
          color: hsl(var(--text-secondary));
        }

        .help-box-worker li {
          margin-bottom: 0.4rem;
        }
      `}</style>
    </div>
  );
}
