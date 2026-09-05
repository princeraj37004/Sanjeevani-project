import React, { useState, useEffect } from 'react';
import { apiRequest, getDemoModeStatus } from '../utils/api';
import StatsCard from '../components/StatsCard';
import CommunityMap from '../components/CommunityMap';
import { 
  Users, 
  Activity as ActivityIcon, 
  AlertTriangle, 
  MapPin, 
  Download, 
  Filter, 
  RefreshCw, 
  CheckCircle,
  FileSpreadsheet,
  FileText
} from 'lucide-react';

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function SupervisorDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dashboard stats
  const [metrics, setMetrics] = useState({
    totalActivities: 0,
    pendingAlerts: 0,
    communitiesCount: 0,
    workersCount: 0
  });

  const [analyticsData, setAnalyticsData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [pendingAlertsList, setPendingAlertsList] = useState([]);
  const [communitiesStats, setCommunitiesStats] = useState([]);
  
  // Filters
  const [filterType, setFilterType] = useState('');
  const [filterVillage, setFilterVillage] = useState('');
  const [filterUrgent, setFilterUrgent] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Load dashboard data
  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch overview metrics & analytics charts
      const overview = await apiRequest('/reports/overview');
      setAnalyticsData(overview);

      // Fetch all activities
      const allActivities = await apiRequest('/activities');
      const safeActivities = Array.isArray(allActivities) ? allActivities : [];
      setActivities(safeActivities);

      // Fetch alerts
      const alerts = await apiRequest('/cases');
      const safeAlerts = Array.isArray(alerts) ? alerts : [];
      const pending = safeAlerts.filter(a => a.status === 'pending');
      setPendingAlertsList(pending);

      // Fetch communities stats (for the map)
      const commsStats = await apiRequest('/communities/stats');
      const safeComms = Array.isArray(commsStats) ? commsStats : [];
      setCommunitiesStats(safeComms);
      
      // Calculate worker count from unique worker IDs in activities
      const uniqueWorkers = new Set(safeActivities.map(a => a.workerId));
      
      setMetrics({
        totalActivities: safeActivities.length,
        pendingAlerts: pending.length,
        communitiesCount: safeComms.length,
        workersCount: Math.max(uniqueWorkers.size, 3)
      });

    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard intelligence reporting.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // CSV Report Exporter
  const handleExportCSV = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filterStartDate) queryParams.append('startDate', filterStartDate);
      if (filterEndDate) queryParams.append('endDate', filterEndDate);
      if (filterType) queryParams.append('type', filterType);
      if (filterVillage) queryParams.append('village', filterVillage);

      const response = await apiRequest(`/reports/export/csv?${queryParams.toString()}`);
      
      let csvContent = "";
      if (response && response.isMockCsv) {
        // Mock mode CSV handler
        csvContent = response.csvData;
      } else if (response instanceof Blob) {
        // Live server Blob handler
        csvContent = await response.text();
      }

      // Trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `outreach_reports_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('CSV compilation failed: ' + err.message);
    }
  };

  // PDF Report Exporter
  const handleExportPDF = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filterStartDate) queryParams.append('startDate', filterStartDate);
      if (filterEndDate) queryParams.append('endDate', filterEndDate);
      if (filterType) queryParams.append('type', filterType);
      if (filterVillage) queryParams.append('village', filterVillage);

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

  // Community CSV Exporter
  const handleExportCommunityCSV = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filterStartDate) queryParams.append('startDate', filterStartDate);
      if (filterEndDate) queryParams.append('endDate', filterEndDate);

      const response = await apiRequest(`/reports/export/communities-csv?${queryParams.toString()}`);
      
      let csvContent = "";
      if (response && response.isMockCsv) {
        csvContent = response.csvData;
      } else if (response instanceof Blob) {
        csvContent = await response.text();
      }

      // Trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `community_outreach_summary_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Community CSV compilation failed: ' + err.message);
    }
  };

  // Quick Resolve Alert (Supervisor action)
  const handleQuickResolve = async (alertId) => {
    const notes = prompt("Enter Case Resolution Notes (Required):");
    if (!notes || !notes.trim()) return;

    try {
      await apiRequest(`/cases/${alertId}/resolve`, {
        method: 'PUT',
        body: JSON.stringify({ resolutionNotes: notes })
      });
      // Reload
      loadDashboardData();
    } catch (err) {
      alert("Failed to resolve alert: " + err.message);
    }
  };

  // Filter logic
  const filteredActivities = activities.filter(a => {
    if (filterType && a.type !== filterType) return false;
    if (filterVillage && a.village.toLowerCase() !== filterVillage.toLowerCase()) return false;
    if (filterUrgent === 'yes' && !a.isUrgent) return false;
    if (filterUrgent === 'no' && a.isUrgent) return false;
    if (filterStartDate && a.date < filterStartDate) return false;
    if (filterEndDate && a.date > filterEndDate) return false;
    return true;
  });

  // Extract unique villages for dropdown filter
  const uniqueVillages = [...new Set(activities.map(a => a.village))];

  // --- CHART DATA COMPILATION ---
  
  // 1. Doughnut Chart: Activity Type Distribution
  const doughnutData = {
    labels: ['Visits', 'Interventions', 'Trainings'],
    datasets: [{
      data: [
        analyticsData?.typeDistribution?.visit || 0,
        analyticsData?.typeDistribution?.intervention || 0,
        analyticsData?.typeDistribution?.training || 0
      ],
      backgroundColor: ['#0ea5e9', '#14b8a6', '#818cf8'],
      borderColor: 'rgba(255, 255, 255, 0.08)',
      borderWidth: 1,
    }]
  };

  // 2. Bar Chart: Outreach by Village
  const barLabels = Object.keys(analyticsData?.villageDistribution || {});
  const barValues = Object.values(analyticsData?.villageDistribution || {});
  
  const barData = {
    labels: barLabels.length ? barLabels : ['Rampur', 'Karanpur', 'Gopalpur'],
    datasets: [{
      label: 'Outreach Frequency',
      data: barValues.length ? barValues : [0, 0, 0],
      backgroundColor: '#10b981',
      borderColor: '#10b981',
      borderWidth: 0,
      borderRadius: 4
    }]
  };

  // 3. Line Chart: Timeline trend
  const sortedDates = Object.keys(analyticsData?.dailyOutreach || {}).sort((a, b) => new Date(a) - new Date(b));
  const lineValues = sortedDates.map(date => analyticsData.dailyOutreach[date]);

  const lineData = {
    labels: sortedDates.length ? sortedDates : ['2026-07-01', '2026-07-02', '2026-07-03'],
    datasets: [{
      label: 'Daily Logs',
      data: lineValues.length ? lineValues : [0, 0, 0],
      fill: true,
      borderColor: '#14b8a6',
      backgroundColor: 'rgba(20, 184, 166, 0.1)',
      tension: 0.3,
      pointRadius: 4,
      pointBackgroundColor: '#14b8a6'
    }]
  };

  // Chart configuration defaults
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { family: 'Inter' } }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.03)' },
        ticks: { color: '#94a3b8' }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.03)' },
        ticks: { color: '#94a3b8', stepSize: 1 }
      }
    }
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="supervisor-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>District Analytics Intelligence</h1>
          <p>Outreach and community health operations supervision dashboard</p>
        </div>

        <div className="action-buttons-group">
          <button className="btn btn-secondary" onClick={loadDashboardData} title="Refresh Live Data">
            <RefreshCw size={18} />
          </button>

          <button className="btn btn-secondary" onClick={handleExportPDF}>
            <FileText size={18} />
            <span>Print PDF Report</span>
          </button>

          <button className="btn btn-primary" onClick={handleExportCommunityCSV}>
            <FileSpreadsheet size={18} />
            <span>Export Community CSV</span>
          </button>
          
          <button className="btn btn-primary" onClick={handleExportCSV}>
            <Download size={18} />
            <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="metrics-grid">
        <StatsCard 
          title="Total Outreach Logs" 
          value={metrics.totalActivities} 
          icon={ActivityIcon}
          trend="12% vs last week"
          trendType="up"
          variant="primary"
        />
        <StatsCard 
          title="Urgent Alerts Pending" 
          value={metrics.pendingAlerts} 
          icon={AlertTriangle}
          variant={metrics.pendingAlerts > 0 ? 'danger' : 'success'}
        />
        <StatsCard 
          title="Communities Tracked" 
          value={metrics.communitiesCount} 
          icon={MapPin}
          variant="info"
        />
        <StatsCard 
          title="Active Field Workers" 
          value={metrics.workersCount} 
          icon={Users}
          variant="success"
        />
      </div>

      {/* Urgent Alerts Attention Panel */}
      {pendingAlertsList.length > 0 && (
        <div className="glass-panel alerts-attention-box">
          <div className="box-header">
            <AlertTriangle className="alert-icon-head" />
            <h3>Action Required: Pending Emergency Cases ({pendingAlertsList.length})</h3>
          </div>
          <div className="alerts-micro-list">
            {pendingAlertsList.map(a => (
              <div key={a._id} className="alert-micro-strip">
                <div className="alert-micro-info">
                  <strong>{a.patientName} ({a.village})</strong>
                  <p>{a.details}</p>
                  <span className="alert-by-meta">Logged by: {a.workerName} | {new Date(a.createdAt).toLocaleDateString()}</span>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => handleQuickResolve(a._id)}>
                  <CheckCircle size={14} />
                  Resolve Case
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Outreach Heatmap */}
      <div className="dashboard-map-section" style={{ marginBottom: '2rem' }}>
        <div className="log-section-header" style={{ marginBottom: '1rem' }}>
          <h3>District Health Outreach Heatmap</h3>
          <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
            Interactive geographical summary of community outreach coverage levels and active emergency alerts
          </span>
        </div>
        <CommunityMap communities={communitiesStats} />
      </div>

      {/* Analytics Charts Grid */}
      <div className="analytics-charts-grid">
        <div className="glass-panel chart-card line-chart">
          <h4>Outreach Volume Trend</h4>
          <div className="chart-wrapper">
            <Line data={lineData} options={chartOptions} />
          </div>
        </div>

        <div className="glass-panel chart-card doughnut-chart">
          <h4>Outreach Service Types</h4>
          <div className="chart-wrapper">
            <Doughnut 
              data={doughnutData} 
              options={{
                ...chartOptions,
                scales: { x: { display: false }, y: { display: false } }
              }} 
            />
          </div>
        </div>

        <div className="glass-panel chart-card bar-chart">
          <h4>Outreach Count by Village (Identify Gaps)</h4>
          <div className="chart-wrapper">
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="glass-panel activities-log-section">
        <div className="log-section-header">
          <h3>Outreach Activity Database</h3>
          
          <div className="table-filters-container">
            <div className="filter-item">
              <Filter size={14} />
              <select value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="">All Services</option>
                <option value="visit">Home Visits</option>
                <option value="intervention">Clinical Interventions</option>
                <option value="training">Health Trainings</option>
              </select>
            </div>

            <div className="filter-item">
              <select value={filterVillage} onChange={e => setFilterVillage(e.target.value)}>
                <option value="">All Villages</option>
                {uniqueVillages.map((v, i) => (
                  <option key={i} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <select value={filterUrgent} onChange={e => setFilterUrgent(e.target.value)}>
                <option value="all">All Urgencies</option>
                <option value="yes">Critical Cases Only</option>
                <option value="no">Routine Cases Only</option>
              </select>
            </div>

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
                  <th>Service</th>
                  <th>Village</th>
                  <th>Worker</th>
                  <th>Patient Name</th>
                  <th>Age/Gender</th>
                  <th>Details Summary</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.map(a => (
                  <tr key={a._id}>
                    <td>{new Date(a.date).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge badge-${a.type}`}>{a.type.toUpperCase()}</span>
                    </td>
                    <td>{a.village}</td>
                    <td>{a.workerName}</td>
                    <td>{a.patientName}</td>
                    <td>{a.type === 'training' ? 'N/A' : `${a.patientAge} / ${a.patientGender}`}</td>
                    <td>
                      <div className="outcome-text-wrapper" title={a.details}>
                        <strong>Details:</strong> {a.details.length > 50 ? `${a.details.substring(0, 50)}...` : a.details}
                        <br/>
                        <strong style={{color: 'hsl(var(--primary))'}}>Outcome:</strong> {a.outcome.length > 50 ? `${a.outcome.substring(0, 50)}...` : a.outcome}
                      </div>
                    </td>
                    <td>
                      {a.isUrgent ? (
                        <span className="badge badge-pending">CRITICAL ALERT</span>
                      ) : (
                        <span className="badge badge-resolved" style={{background: 'rgba(255, 255, 255, 0.03)', color: '#94a3b8', border: '1px solid rgba(255, 255, 255, 0.08)'}}>ROUTINE</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="table-empty">
              <FileSpreadsheet size={40} />
              <p>No activity logs found matching the selected search filters.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .supervisor-dashboard {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .action-buttons-group {
          display: flex;
          gap: 0.75rem;
        }

        .alerts-attention-box {
          background: rgba(244, 63, 94, 0.06) !important;
          border-color: rgba(244, 63, 94, 0.25) !important;
          margin-bottom: 2rem;
          padding: 1.5rem;
        }

        .alerts-attention-box .box-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
          color: hsl(var(--danger));
        }

        .alert-icon-head {
          animation: wiggle 1s infinite alternate;
        }

        @keyframes wiggle {
          from { transform: rotate(-5deg); }
          to { transform: rotate(5deg); }
        }

        .alerts-micro-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .alert-micro-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-sm);
          gap: 1rem;
        }

        .alert-micro-info {
          flex: 1;
        }

        .alert-micro-info strong {
          color: hsl(var(--danger));
          font-size: 0.95rem;
          display: block;
        }

        .alert-micro-info p {
          font-size: 0.85rem;
          color: hsl(var(--text-primary));
          margin: 0.15rem 0;
        }

        .alert-by-meta {
          font-size: 0.7rem;
          color: hsl(var(--text-secondary));
        }

        @media (max-width: 600px) {
          .alert-micro-strip {
            flex-direction: column;
            align-items: flex-start;
          }
          .alert-micro-strip button {
            width: 100%;
          }
        }

        .analytics-charts-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .analytics-charts-grid > *:last-child {
          grid-column: span 2;
        }

        @media (max-width: 1024px) {
          .analytics-charts-grid {
            grid-template-columns: 1fr;
          }
          .analytics-charts-grid > *:last-child {
            grid-column: span 1;
          }
        }

        .chart-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
        }

        .chart-card h4 {
          font-size: 1rem;
          margin-bottom: 1.25rem;
          color: hsl(var(--text-secondary));
        }

        .chart-wrapper {
          position: relative;
          height: 250px;
          width: 100%;
        }

        .activities-log-section {
          padding: 1.5rem;
        }

        .log-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .table-filters-container {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .filter-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(15, 23, 42, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-sm);
          padding: 0.4rem 0.75rem;
          font-size: 0.8rem;
          color: hsl(var(--text-secondary));
        }

        .filter-item select {
          background: none;
          border: none;
          color: hsl(var(--text-primary));
          outline: none;
          font-weight: 500;
          cursor: pointer;
        }

        .filter-item select option {
          background: hsl(var(--card-bg));
          color: hsl(var(--text-primary));
        }

        .outcome-text-wrapper {
          font-size: 0.8rem;
          line-height: 1.4;
          max-width: 400px;
        }

        .table-empty {
          text-align: center;
          padding: 3rem;
          color: hsl(var(--text-secondary));
        }

        .table-empty svg {
          color: hsl(var(--text-muted));
          margin-bottom: 0.75rem;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
