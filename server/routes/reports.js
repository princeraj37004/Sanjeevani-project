const express = require('express');
const router = express.Router();
const { Activity, User, Community, CaseAlert } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

// EXPORT FILTERED ACTIVITIES TO CSV
router.get('/export/csv', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, type, village, workerId } = req.query;

    let query = {};
    
    // Workers can only export their own activities
    if (req.user.role === 'worker') {
      query.workerId = req.user.id;
    } else if (workerId) {
      query.workerId = workerId;
    }

    if (type) query.type = type;
    if (village) query.village = village;

    let activities = await Activity.find(query);
    
    // Filter by date range in memory
    if (startDate) {
      activities = activities.filter(a => a.date >= startDate);
    }
    if (endDate) {
      activities = activities.filter(a => a.date <= endDate);
    }

    // Sort by date descending
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Define CSV Headers matching criteria (date, community, type, notes)
    const headers = [
      'Date',
      'Community',
      'Type',
      'Health Worker',
      'Patient Name',
      'Patient Age',
      'Patient Gender',
      'Notes',
      'Outcome',
      'Urgent Case?',
      'Logged At'
    ];

    // Build CSV Rows
    const rows = activities.map(a => [
      a.date,
      a.village, // Community
      a.type.toUpperCase(),
      a.workerName,
      `"${(a.patientName || '').replace(/"/g, '""')}"`,
      a.patientAge,
      a.patientGender,
      `"${(a.details || '').replace(/"/g, '""')}"`, // Notes
      `"${(a.outcome || '').replace(/"/g, '""')}"`,
      a.isUrgent ? 'YES' : 'NO',
      a.createdAt
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Set Response Headers for download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=rural_health_outreach_report.csv');
    res.status(200).send(csvContent);
  } catch (err) {
    console.error('CSV export error:', err);
    res.status(500).json({ message: 'Server error generating CSV report' });
  }
});

// EXPORT FILTERED ACTIVITIES AS PRINTABLE SUMMARY (PDF FLOW)
router.get('/export/pdf', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, type, village, workerId } = req.query;

    let query = {};
    
    // Workers can only export their own activities
    if (req.user.role === 'worker') {
      query.workerId = req.user.id;
    } else if (workerId) {
      query.workerId = workerId;
    }

    if (type) query.type = type;
    if (village) query.village = village;

    let activities = await Activity.find(query);
    
    // Filter by date range in memory
    if (startDate) {
      activities = activities.filter(a => a.date >= startDate);
    }
    if (endDate) {
      activities = activities.filter(a => a.date <= endDate);
    }

    // Sort by date descending
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Stats calculations for report header
    const totalLogs = activities.length;
    const visitsCount = activities.filter(a => a.type === 'visit').length;
    const interventionsCount = activities.filter(a => a.type === 'intervention').length;
    const trainingsCount = activities.filter(a => a.type === 'training').length;
    const urgentCount = activities.filter(a => a.isUrgent).length;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Sanjeevani Health Outreach Summary Report</title>
  <style>
    body {
      font-family: 'Inter', Helvetica, Arial, sans-serif;
      color: #1f2937;
      padding: 30px;
      line-height: 1.5;
      background: #ffffff;
    }
    .header {
      border-bottom: 3px solid #14b8a6;
      padding-bottom: 20px;
      margin-bottom: 25px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header h1 {
      margin: 0;
      color: #0f766e;
      font-size: 26px;
      font-family: 'Outfit', sans-serif;
    }
    .header p {
      margin: 5px 0 0 0;
      font-size: 13px;
      color: #4b5563;
    }
    .meta-box {
      background: #f3f4f6;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 25px;
      font-size: 13px;
      border: 1px solid #e5e7eb;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    .stats-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 25px;
      gap: 15px;
    }
    .stat-card {
      flex: 1;
      border: 1px solid #e5e7eb;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      background: #fafafa;
    }
    .stat-card h3 {
      margin: 0;
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .stat-card p {
      margin: 5px 0 0 0;
      font-size: 24px;
      font-weight: 700;
      color: #111827;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-top: 20px;
    }
    th, td {
      border: 1px solid #e5e7eb;
      padding: 10px 12px;
      text-align: left;
    }
    th {
      background-color: #f9fafb;
      color: #374151;
      font-weight: 600;
    }
    tr:nth-child(even) {
      background-color: #fcfcfc;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-visit { background: #e0f2fe; color: #0369a1; }
    .badge-intervention { background: #ccfbf1; color: #0f766e; }
    .badge-training { background: #e0e7ff; color: #4338ca; }
    .badge-urgent { background: #ffe4e6; color: #b91c1c; }
    .footer {
      margin-top: 50px;
      border-top: 1px solid #e5e7eb;
      padding-top: 20px;
      text-align: center;
      font-size: 11px;
      color: #6b7280;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Sanjeevani Health Outreach Summary Report</h1>
      <p>Ministry of Rural Health Outreach & Community Reporting System</p>
    </div>
    <div style="text-align: right">
      <div style="font-size: 12px; font-weight: bold; color: #0f766e">REPORT ID: SR-${Math.floor(Math.random() * 90000) + 10000}</div>
      <p>Generated: ${new Date().toLocaleString()}</p>
    </div>
  </div>

  <div class="meta-box">
    <div class="meta-grid">
      <div><strong>Supervisor/Requester:</strong> ${req.user.name} (${req.user.role.toUpperCase()})</div>
      <div><strong>Assigned Village Coverage:</strong> ${req.user.village}</div>
      <div><strong>Reporting Period:</strong> ${startDate || 'Earliest'} to ${endDate || 'Latest'}</div>
      <div><strong>Filters Applied:</strong> Service: ${type || 'All'} | Village: ${village || 'All'}</div>
    </div>
  </div>

  <div class="stats-row">
    <div class="stat-card">
      <h3>Total Logs</h3>
      <p>${totalLogs}</p>
    </div>
    <div class="stat-card">
      <h3>Home Visits</h3>
      <p>${visitsCount}</p>
    </div>
    <div class="stat-card">
      <h3>Interventions</h3>
      <p>${interventionsCount}</p>
    </div>
    <div class="stat-card">
      <h3>Trainings</h3>
      <p>${trainingsCount}</p>
    </div>
    <div class="stat-card" style="border-color: ${urgentCount > 0 ? '#f43f5e' : '#e5e7eb'}">
      <h3 style="color: ${urgentCount > 0 ? '#b91c1c' : '#6b7280'}">Critical Cases</h3>
      <p style="color: ${urgentCount > 0 ? '#b91c1c' : '#111827'}">${urgentCount}</p>
    </div>
  </div>

  <h2 style="font-size: 18px; margin-top: 30px; color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Outreach Log Breakdown</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 75px;">Date</th>
        <th style="width: 80px;">Service</th>
        <th style="width: 85px;">Community</th>
        <th style="width: 95px;">Worker</th>
        <th style="width: 105px;">Patient Info</th>
        <th>Log Details / Notes</th>
        <th>Referral / Outcome</th>
        <th style="width: 60px;">Urgency</th>
      </tr>
    </thead>
    <tbody>
      ${activities.length > 0 ? activities.map(a => `
        <tr>
          <td>${a.date}</td>
          <td><span class="badge badge-${a.type}">${a.type}</span></td>
          <td>${a.village}</td>
          <td>${a.workerName}</td>
          <td>${a.type === 'training' ? 'N/A' : `${a.patientName} (${a.patientAge}/${a.patientGender[0]})`}</td>
          <td>${a.details}</td>
          <td>${a.outcome}</td>
          <td>${a.isUrgent ? '<span class="badge badge-urgent">CRITICAL</span>' : 'Routine'}</td>
        </tr>
      `).join('') : '<tr><td colspan="8" style="text-align:center; padding: 20px; color: #9ca3af;">No outreach records found matching the applied filter criteria.</td></tr>'}
    </tbody>
  </table>

  <div class="footer">
    <p>This is a system-generated health data summary report from Sanjeevani Rural Health Activity Tracker.</p>
    <p>© 2026 Government of Bihar Community Outreach Records. Confidential document for verified supervisors only.</p>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
    `;
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(htmlContent);
  } catch (err) {
    console.error('PDF export error:', err);
    res.status(500).send('Server error compiling PDF report.');
  }
});

// EXPORT COMMUNITY-LEVEL OUTREACH STATISTICS TO CSV
router.get('/export/communities-csv', authenticate, authorize('supervisor'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const communities = await Community.find();
    const activities = await Activity.find();
    const alerts = await CaseAlert.find();

    // Filter activities by date range
    let filteredActivities = activities;
    if (startDate) {
      filteredActivities = filteredActivities.filter(a => a.date >= startDate);
    }
    if (endDate) {
      filteredActivities = filteredActivities.filter(a => a.date <= endDate);
    }

    // Define CSV Headers matching criteria (community name, total visits, interventions, trends)
    const headers = [
      'Community Name',
      'District',
      'Population',
      'Assigned Health Worker',
      'Total Home Visits',
      'Total Interventions',
      'Total Health Trainings',
      'Total Outreach Activities',
      'Active Urgent Alerts',
      'Outreach Status (Trend)'
    ];

    // Build CSV Rows
    const rows = communities.map(c => {
      const vActivities = filteredActivities.filter(a => a.village.toLowerCase() === c.name.toLowerCase());
      const visits = vActivities.filter(a => a.type === 'visit').length;
      const interventions = vActivities.filter(a => a.type === 'intervention').length;
      const trainings = vActivities.filter(a => a.type === 'training').length;
      const pendingAlerts = alerts.filter(a => a.village.toLowerCase() === c.name.toLowerCase() && a.status === 'pending').length;

      // Outreach Trend classification
      let trendStatus = 'Underserved Gap';
      if (pendingAlerts > 0) trendStatus = 'Critical Alert Active';
      else if (vActivities.length >= 10) trendStatus = 'High Coverage';
      else if (vActivities.length >= 3) trendStatus = 'Moderate Coverage';

      return [
        c.name,
        c.district,
        c.population,
        c.healthWorker,
        visits,
        interventions,
        trainings,
        vActivities.length,
        pendingAlerts,
        trendStatus
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Set Response Headers for download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=community_outreach_summary.csv');
    res.status(200).send(csvContent);
  } catch (err) {
    console.error('Community CSV export error:', err);
    res.status(500).json({ message: 'Server error generating community CSV report' });
  }
});

// GET GENERAL OUTREACH ANALYTICS OVERVIEW (For charts)
router.get('/overview', authenticate, authorize('supervisor'), async (req, res) => {
  try {
    const activities = await Activity.find();
    
    // Group by activity type
    const typeDistribution = { visit: 0, intervention: 0, training: 0 };
    // Group by village
    const villageDistribution = {};
    // Timeline analysis (outreach in the last 7 days)
    const dailyOutreach = {};

    activities.forEach(a => {
      // Type count
      if (typeDistribution[a.type] !== undefined) {
        typeDistribution[a.type]++;
      }

      // Village count
      villageDistribution[a.village] = (villageDistribution[a.village] || 0) + 1;

      // Date count (grouping by last 14 days)
      const dateStr = a.date;
      dailyOutreach[dateStr] = (dailyOutreach[dateStr] || 0) + 1;
    });

    res.json({
      totalLogs: activities.length,
      typeDistribution,
      villageDistribution,
      dailyOutreach
    });
  } catch (err) {
    console.error('Analytics overview error:', err);
    res.status(500).json({ message: 'Server error fetching analytics overview' });
  }
});

module.exports = router;
