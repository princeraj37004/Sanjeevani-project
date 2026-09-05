
// API Request Layer with Transparent LocalStorage Fallback

const BASE_URL = '/api';
let isDemoMode = false;
// Seed Mock Data in LocalStorage for Demo Mode if not already initialized
function initLocalStorageMock() {
  if (!localStorage.getItem('sh_users')) {
    localStorage.setItem('sh_users', JSON.stringify([
      { _id: 'u1', name: 'Dr. Aarav Sharma', email: 'supervisor@health.gov.in', password: 'password123', role: 'supervisor', village: 'All Districts' },
      { _id: 'u2', name: 'Sunita Devi', email: 'worker1@health.gov.in', password: 'password123', role: 'worker', village: 'Rampur' },
      { _id: 'u3', name: 'Rajesh Kumar', email: 'worker2@health.gov.in', password: 'password123', role: 'worker', village: 'Karanpur' },
      { _id: 'u4', name: 'Meena Kumari', email: 'worker3@health.gov.in', password: 'password123', role: 'worker', village: 'Gopalpur' }
    ]));
  }

  if (!localStorage.getItem('sh_communities')) {
    localStorage.setItem('sh_communities', JSON.stringify([
      { _id: 'c1', name: 'Rampur', district: 'Patna', population: 1200, healthWorker: 'Sunita Devi', lat: 25.5941, lng: 85.1376 },
      { _id: 'c2', name: 'Karanpur', district: 'Patna', population: 850, healthWorker: 'Rajesh Kumar', lat: 25.6120, lng: 85.1520 },
      { _id: 'c3', name: 'Gopalpur', district: 'Patna', population: 1500, healthWorker: 'Meena Kumari', lat: 25.5780, lng: 85.1050 },
      { _id: 'c4', name: 'Sonpur', district: 'Saran', population: 2200, healthWorker: 'Unassigned', lat: 25.6985, lng: 85.1725 },
      { _id: 'c5', name: 'Bihta', district: 'Patna', population: 3100, healthWorker: 'Unassigned', lat: 25.5606, lng: 84.8732 }
    ]));
  }

  if (!localStorage.getItem('sh_activities')) {
    const mockActivities = [];
    const patients = [
      { name: 'Ramesh Singh', age: 45, gender: 'Male' },
      { name: 'Anita Devi', age: 28, gender: 'Female' },
      { name: 'Pooja Kumari', age: 3, gender: 'Female' },
      { name: 'Rahul Yadav', age: 62, gender: 'Male' },
      { name: 'Vikram Prasad', age: 35, gender: 'Male' },
      { name: 'Sita Ram', age: 71, gender: 'Female' }
    ];
    const workers = [
      { id: 'u2', name: 'Sunita Devi', village: 'Rampur' },
      { id: 'u3', name: 'Rajesh Kumar', village: 'Karanpur' },
      { id: 'u4', name: 'Meena Kumari', village: 'Gopalpur' }
    ];
    const outcomes = {
      visit: ['Referred to District Hospital', 'Prescribed local medicine', 'Routine checkup completed', 'Prenatal counselling done'],
      intervention: ['Vaccinated child', 'Administered first aid', 'Distributed nutrition supplements', 'Conducted blood sugar test'],
      training: ['Conducted hygiene awareness session', 'Held family planning seminar', 'Organized sanitation workshop']
    };
    const activityTypes = ['visit', 'intervention', 'training'];

    for (let i = 0; i < 24; i++) {
      const w = workers[i % workers.length];
      const type = activityTypes[i % activityTypes.length];
      const p = patients[i % patients.length];
      const date = new Date();
      date.setDate(date.getDate() - (i % 10));
      const isUrgent = (i === 3 || i === 9 || i === 15);

      mockActivities.push({
        _id: `act_${i}`,
        workerId: w.id,
        workerName: w.name,
        date: date.toISOString().split('T')[0],
        type: type,
        patientName: type === 'training' ? 'N/A' : p.name,
        patientAge: type === 'training' ? 0 : p.age,
        patientGender: type === 'training' ? 'N/A' : p.gender,
        village: w.village,
        details: type === 'training' 
          ? `Hygiene and sanitization drive conducted in village square.` 
          : `${type.toUpperCase()} conducted for ${p.name} at their residence.`,
        outcome: outcomes[type][i % outcomes[type].length],
        isUrgent: isUrgent,
        createdAt: date.toISOString()
      });
    }
    localStorage.setItem('sh_activities', JSON.stringify(mockActivities));
  }

  if (!localStorage.getItem('sh_alerts')) {
    localStorage.setItem('sh_alerts', JSON.stringify([
      {
        _id: 'a1',
        activityId: 'act_3',
        workerId: 'u2',
        workerName: 'Sunita Devi',
        village: 'Rampur',
        patientName: 'Rahul Yadav',
        details: 'CRITICAL CASE: Patient reported severe breathing problems during household visit.',
        status: 'pending',
        resolvedBy: '',
        resolutionNotes: '',
        createdAt: new Date().toISOString()
      },
      {
        _id: 'a2',
        activityId: 'act_9',
        workerId: 'u3',
        workerName: 'Rajesh Kumar',
        village: 'Karanpur',
        patientName: 'Pooja Kumari',
        details: 'CRITICAL CASE: Toddler showing severe symptoms of dehydration and fever.',
        status: 'pending',
        resolvedBy: '',
        resolutionNotes: '',
        createdAt: new Date().toISOString()
      }
    ]));
  }
}

// Check backend availability
export async function checkBackendStatus() {
  try {
    const res = await fetch(`${BASE_URL}/health`, {
      signal: AbortSignal.timeout(1500)
    });

    if (res.ok) {
      isDemoMode = false;
      return true;
    }
  } catch (err) {
    isDemoMode = true;
    initLocalStorageMock();
    console.warn("Backend unavailable. Switching to Demo Mode.");
    return false;
  }

  isDemoMode = true;
  initLocalStorageMock();
  return false;
}

// Helper to get headers
function getHeaders() {
  const token = localStorage.getItem('sh_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

// API Request function
export async function apiRequest(endpoint, options = {}) {
  // Ensure we check status once
  if (isDemoMode === undefined || options.forceCheck) {
    await checkBackendStatus(options);
  }

  if (!isDemoMode) {
    try {
      const url = `${BASE_URL}${endpoint}`;
      const res = await fetch(url, {
        ...options,
        headers: {
          ...getHeaders(),
          ...options.headers
        }
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          console.warn(`API returned 401 for ${endpoint}. Falling back to demo mode.`);
          isDemoMode = true;
          initLocalStorageMock();
          return handleMockRequest(endpoint, options);

        }

        // Patients endpoint

        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'API request failed');
      }

      // Check if attachment
      const disposition = res.headers.get('content-disposition');
      if (disposition && disposition.indexOf('attachment') !== -1) {
        return res.blob();
      }

      return await res.json();
    } catch (err) {
      // If we get a fetch TypeError, server might have gone down midway
      if (err.name === 'TypeError' || err.message.includes('Failed to fetch')) {
        isDemoMode = true;
        initLocalStorageMock();
        console.warn("Lost connection to server. Falling back to Demo Mode.");
        return handleMockRequest(endpoint, options);
      }
      throw err;
    }
  } else 
    return handleMockRequest(endpoint, options);
  
}
if (!localStorage.getItem("sh_patients")) {
  localStorage.setItem(
    "sh_patients",
    JSON.stringify([
      {
        _id: "1",
        name: "Ramesh Kumar",
        age: 45,
        gender: "Male",
        village: "Rampur",
        disease: "Diabetes",
        status: "Active"
      },
      {
        _id: "2",
        name: "Sita Devi",
        age: 32,
        gender: "Female",
        village: "Rampur",
        disease: "Pregnancy Checkup",
        status: "Recovered"
      },
      {
        _id: "3",
        name: "Rahul Singh",
        age: 10,
        gender: "Male",
        village: "Gopalpur",
        disease: "Fever",
        status: "Recovered"
      },
      {
        _id: "4",
        name: "Anita Kumari",
        age: 60,
        gender: "Female",
        village: "Karanpur",
        disease: "Hypertension",
        status: "Critical"
      },
      {
        _id: "5",
        name: "Mohan Yadav",
        age: 52,
        gender: "Male",
        village: "Bihta",
        disease: "Heart Disease",
        status: "Critical"
      }
    ])
  );
}

export function getDemoModeStatus() {
  return isDemoMode;
}
 const getCollection = (key) => JSON.parse(localStorage.getItem(key) || '[]');
  const setCollection = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// MOCK LOCAL STORAGE HANDLERS
function handleMockRequest(endpoint, options) {
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body) : null;
  const token = localStorage.getItem('sh_token');
  // Patients
if (endpoint === '/patients' && method === 'GET') {
  return getCollection('sh_patients');
}
  
  // Auth mock middlewaref
  let currentUser = null;
  if (token) {
    try {
      currentUser = JSON.parse(localStorage.getItem('sh_current_user'));
    } catch (e) {
      currentUser = null;
    }
  }

  // Helper to retrieve collections
 

  // --- ROUTING ---

  // Auth endpoints
  if (endpoint === '/auth/login' && method === 'POST') {
    const users = getCollection('sh_users');
    const user = users.find(u => u.email === body.email && u.password === body.password);
    if (!user) {
      throw new Error('Invalid email or password');
    }
    const fakeToken = `mock_token_${user._id}_${Date.now()}`;
    localStorage.setItem('sh_token', fakeToken);
    
    const userProfile = { id: user._id, name: user.name, email: user.email, role: user.role, village: user.village };
    localStorage.setItem('sh_current_user', JSON.stringify(userProfile));
    
    return { token: fakeToken, user: userProfile };
  }

  if (endpoint === '/auth/register' && method === 'POST') {
    const users = getCollection('sh_users');
    if (users.some(u => u.email === body.email)) {
      throw new Error('Email already registered');
    }
    const newUser = {
      _id: `u_${Date.now()}`,
      name: body.name,
      email: body.email,
      password: body.password || 'password123',
      role: body.role,
      village: body.role === 'supervisor' ? 'All Districts' : (body.village || 'Unassigned')
    };
    users.push(newUser);
    setCollection('sh_users', users);

    // Update community worker if assigned
    if (body.role === 'worker' && body.village) {
      const comms = getCollection('sh_communities');
      const idx = comms.findIndex(c => c.name === body.village);
      if (idx !== -1) {
        comms[idx].healthWorker = body.name;
        setCollection('sh_communities', comms);
      }
    }

    const fakeToken = `mock_token_${newUser._id}_${Date.now()}`;
    localStorage.setItem('sh_token', fakeToken);
    
    const userProfile = { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, village: newUser.village };
    localStorage.setItem('sh_current_user', JSON.stringify(userProfile));
    
    return { token: fakeToken, user: userProfile };
  }

  if (endpoint === '/auth/register-worker' && method === 'POST') {
    if (!currentUser || currentUser.role !== 'supervisor') {
      throw new Error('Unauthorized: Only supervisors can register health workers');
    }
    const users = getCollection('sh_users');
    if (users.some(u => u.email === body.email)) {
      throw new Error('An account with this email is already registered');
    }
    
    const userRole = body.role || 'worker';
    const tempPassword = 'SHW_' + Math.random().toString(36).substring(2, 8).toUpperCase() + '@2026';
    const newUser = {
      _id: `u_${Date.now()}`,
      name: body.name,
      email: body.email,
      password: tempPassword,
      role: userRole,
      village: userRole === 'supervisor' ? 'All Districts' : (body.village || 'Unassigned')
    };
    users.push(newUser);
    setCollection('sh_users', users);

    // Update community worker if assigned and is worker
    if (userRole === 'worker' && body.village) {
      const comms = getCollection('sh_communities');
      const idx = comms.findIndex(c => c.name === body.village);
      if (idx !== -1) {
        comms[idx].healthWorker = body.name;
        setCollection('sh_communities', comms);
      }
    }

    return {
      message: 'User registered successfully.',
      worker: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        village: newUser.village,
        tempPassword
      }
    };
  }

  if (endpoint === '/auth/me' && method === 'GET') {
    if (!currentUser) throw new Error('Unauthenticated');
    return currentUser;
  }

  // Activities endpoints
  if (endpoint.startsWith('/activities') && method === 'GET') {
    if (!currentUser) throw new Error('Unauthenticated');
    const activities = getCollection('sh_activities');
    
    // Check if single ID retrieval
    const parts = endpoint.split('/');
    if (parts.length === 3 && parts[2]) {
      const act = activities.find(a => a._id === parts[2]);
      if (!act) throw new Error('Activity not found');
      return act;
    }

    // List retrieval
    let filtered = activities;
    if (currentUser.role === 'worker') {
      filtered = activities.filter(a => a.workerId === currentUser.id);
    }
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    return filtered;
  }

  if (endpoint === '/activities' && method === 'POST') {
    if (!currentUser) throw new Error('Unauthenticated');
    const activities = getCollection('sh_activities');
    const newAct = {
      _id: `act_${Date.now()}`,
      workerId: currentUser.id,
      workerName: currentUser.name,
      date: body.date,
      type: body.type,
      patientName: body.type === 'training' ? 'N/A' : (body.patientName || 'Anonymous'),
      patientAge: body.type === 'training' ? 0 : Number(body.patientAge || 0),
      patientGender: body.type === 'training' ? 'N/A' : (body.patientGender || 'Other'),
      village: currentUser.role === 'worker' ? currentUser.village : (body.village || 'Unassigned'),
      details: body.details,
      outcome: body.outcome,
      isUrgent: !!body.isUrgent,
      createdAt: new Date().toISOString()
    };
    activities.push(newAct);
    setCollection('sh_activities', activities);

    // If critical alert raised, push alert
    if (newAct.isUrgent) {
      const alerts = getCollection('sh_alerts');
      alerts.push({
        _id: `alert_${Date.now()}`,
        activityId: newAct._id,
        workerId: currentUser.id,
        workerName: currentUser.name,
        village: newAct.village,
        patientName: newAct.patientName,
        details: `CRITICAL CASE: Registered during field ${body.type}. Patient: ${newAct.patientName}. Details: ${body.details}.`,
        status: 'pending',
        resolvedBy: '',
        resolutionNotes: '',
        createdAt: new Date().toISOString()
      });
      setCollection('sh_alerts', alerts);
    }

    return newAct;
  }

  if (endpoint.startsWith('/activities/') && method === 'PUT') {
    if (!currentUser) throw new Error('Unauthenticated');
    const activities = getCollection('sh_activities');
    const actId = endpoint.split('/')[2];
    const idx = activities.findIndex(a => a._id === actId);
    if (idx === -1) throw new Error('Activity not found');

    const updated = {
      ...activities[idx],
      ...body,
      patientAge: body.patientAge !== undefined ? Number(body.patientAge) : activities[idx].patientAge,
      isUrgent: body.isUrgent !== undefined ? !!body.isUrgent : activities[idx].isUrgent
    };
    activities[idx] = updated;
    setCollection('sh_activities', activities);

    // Sync Case Alerts
    const alerts = getCollection('sh_alerts');
    const alertIdx = alerts.findIndex(a => a.activityId === actId);

    if (updated.isUrgent && alertIdx === -1) {
      // Create alert
      alerts.push({
        _id: `alert_${Date.now()}`,
        activityId: updated._id,
        workerId: updated.workerId,
        workerName: updated.workerName,
        village: updated.village,
        patientName: updated.patientName,
        details: `CRITICAL CASE: Updated during field ${updated.type}. Patient: ${updated.patientName}. Details: ${updated.details}.`,
        status: 'pending',
        resolvedBy: '',
        resolutionNotes: '',
        createdAt: new Date().toISOString()
      });
      setCollection('sh_alerts', alerts);
    } else if (!updated.isUrgent && alertIdx !== -1) {
      // Remove alert
      alerts.splice(alertIdx, 1);
      setCollection('sh_alerts', alerts);
    } else if (alertIdx !== -1) {
      // Update details
      alerts[alertIdx].patientName = updated.patientName;
      alerts[alertIdx].details = `CRITICAL CASE: Updated during field ${updated.type}. Patient: ${updated.patientName}. Details: ${updated.details}.`;
      setCollection('sh_alerts', alerts);
    }

    return updated;
  }

  if (endpoint.startsWith('/activities/') && method === 'DELETE') {
    if (!currentUser) throw new Error('Unauthenticated');
    const activities = getCollection('sh_activities');
    const actId = endpoint.split('/')[2];
    const filtered = activities.filter(a => a._id !== actId);
    setCollection('sh_activities', filtered);

    // Delete matching alert
    const alerts = getCollection('sh_alerts');
    const filteredAlerts = alerts.filter(a => a.activityId !== actId);
    setCollection('sh_alerts', filteredAlerts);

    return { message: 'Deleted successfully' };
  }

  // Case alerts endpoints
  if (endpoint === '/cases' && method === 'GET') {
    if (!currentUser) throw new Error('Unauthenticated');
    const alerts = getCollection('sh_alerts');
    let filtered = alerts;
    if (currentUser.role === 'worker') {
      filtered = alerts.filter(a => a.village === currentUser.village);
    }
    filtered.sort((a, b) => {
      if (a.status === 'pending' && b.status === 'resolved') return -1;
      if (a.status === 'resolved' && b.status === 'pending') return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    return filtered;
  }

  if (endpoint.startsWith('/cases/') && endpoint.endsWith('/resolve') && method === 'PUT') {
    if (!currentUser) {
      throw new Error('Unauthorized');
    }
    const alerts = getCollection('sh_alerts');
    const alertId = endpoint.split('/')[2];
    const idx = alerts.findIndex(a => a._id === alertId);
    if (idx === -1) throw new Error('Alert not found');

    alerts[idx].status = 'resolved';
    alerts[idx].resolvedBy = currentUser.name;
    alerts[idx].resolutionNotes = body.resolutionNotes;
    
    setCollection('sh_alerts', alerts);
    return alerts[idx];
  }
  // Patients endpoints
if (endpoint === "/patients" && method === "GET") {
  if (!localStorage.getItem("sh_patients")) {
    localStorage.setItem(
      "sh_patients",
      JSON.stringify([
        {
          _id: "1",
          name: "Ramesh Kumar",
          age: 45,
          gender: "Male",
          village: "Rampur",
          disease: "Diabetes",
          status: "Active"
        },
        {
          _id: "2",
          name: "Sita Devi",
          age: 32,
          gender: "Female",
          village: "Rampur",
          disease: "Pregnancy Checkup",
          status: "Recovered"
        },
        {
          _id: "3",
          name: "Rahul Singh",
          age: 10,
          gender: "Male",
          village: "Gopalpur",
          disease: "Fever",
          status: "Recovered"
        },
        {
          _id: "4",
          name: "Anita Kumari",
          age: 60,
          gender: "Female",
          village: "Karanpur",
          disease: "Hypertension",
          status: "Critical"
        },
        {
          _id: "5",
          name: "Mohan Yadav",
          age: 52,
          gender: "Male",
          village: "Bihta",
          disease: "Heart Disease",
          status: "Critical"
        }
      ])
    );
  }

  return JSON.parse(localStorage.getItem("sh_patients"));
}

// Add Patient
if (endpoint === "/patients" && method === "POST") {
  const patients = getCollection("sh_patients");

  const newPatient = {
    _id: Date.now().toString(),
    ...body,
    status: body.status || "Active",
  };

  patients.push(newPatient);

  setCollection("sh_patients", patients);

  return newPatient;
}
  // Communities endpoints
  if (endpoint === '/communities' && method === 'GET') {
    return getCollection('sh_communities');
  }

  if (endpoint === '/communities' && method === 'POST') {
    if (!currentUser) throw new Error('Unauthorized');
    const comms = getCollection('sh_communities');
    const newComm = {
      _id: `c_${Date.now()}`,
      name: body.name,
      district: body.district,
      population: Number(body.population),
      healthWorker: body.healthWorker || 'Unassigned',
      lat: Number(body.lat || 0),
      lng: Number(body.lng || 0)
    };
    comms.push(newComm);
    setCollection('sh_communities', comms);
    return newComm;
  }

  if (endpoint === '/communities/stats' && method === 'GET') {
    const comms = getCollection('sh_communities');
    const activities = getCollection('sh_activities');
    const alerts = getCollection('sh_alerts');

    return comms.map(c => {
      const vActs = activities.filter(a => a.village.toLowerCase() === c.name.toLowerCase());
      const vAlerts = alerts.filter(a => a.village.toLowerCase() === c.name.toLowerCase() && a.status === 'pending');
      
      return {
        _id: c._id,
        name: c.name,
        district: c.district,
        population: c.population,
        healthWorker: c.healthWorker,
        lat: c.lat,
        lng: c.lng,
        activityCount: vActs.length,
        pendingAlertsCount: vAlerts.length,
        lastActivityDate: vActs.length > 0
          ? vActs.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date
          : null
      };
    });
  }

  // Reports endpoints
  if (endpoint === '/reports/overview' && method === 'GET') {
    if (!currentUser || currentUser.role !== 'supervisor') throw new Error('Unauthorized');
    const activities = getCollection('sh_activities');
    
    const typeDistribution = { visit: 0, intervention: 0, training: 0 };
    const villageDistribution = {};
    const dailyOutreach = {};

    activities.forEach(a => {
      if (typeDistribution[a.type] !== undefined) typeDistribution[a.type]++;
      villageDistribution[a.village] = (villageDistribution[a.village] || 0) + 1;
      dailyOutreach[a.date] = (dailyOutreach[a.date] || 0) + 1;
    });

    return {
      totalLogs: activities.length,
      typeDistribution,
      villageDistribution,
      dailyOutreach
    };
  }

  if (endpoint.startsWith('/reports/export/csv') && method === 'GET') {
    if (!currentUser) throw new Error('Unauthenticated');
    const activities = getCollection('sh_activities');

    // Parse query params in mock request
    let urlObj;
    try {
      urlObj = new URL(endpoint, 'http://localhost');
    } catch (e) {
      urlObj = new URL('/reports/export/csv', 'http://localhost');
    }
    const startDate = urlObj.searchParams.get('startDate');
    const endDate = urlObj.searchParams.get('endDate');
    const type = urlObj.searchParams.get('type');
    const village = urlObj.searchParams.get('village');
    const workerId = urlObj.searchParams.get('workerId');

    // Filter collection
    let filtered = activities;
    
    // Workers can only export their own activities
    if (currentUser.role === 'worker') {
      filtered = filtered.filter(a => a.workerId === currentUser.id);
    } else if (workerId) {
      filtered = filtered.filter(a => a.workerId === workerId);
    }

    if (type) {
      filtered = filtered.filter(a => a.type === type);
    }
    if (village) {
      filtered = filtered.filter(a => a.village.toLowerCase() === village.toLowerCase());
    }
    if (startDate) {
      filtered = filtered.filter(a => a.date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(a => a.date <= endDate);
    }

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Headers matching criteria (date, community, type, notes)
    const headers = ['Date', 'Community', 'Type', 'Health Worker', 'Patient Name', 'Patient Age', 'Patient Gender', 'Notes', 'Outcome', 'Urgent Case?', 'Logged At'];
    
    const rows = filtered.map(a => [
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

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    return { isMockCsv: true, csvData: csvContent };
  }

  if (endpoint.startsWith('/reports/export/pdf') && method === 'GET') {
    if (!currentUser) throw new Error('Unauthenticated');
    const activities = getCollection('sh_activities');

    // Parse query params in mock request
    let urlObj;
    try {
      urlObj = new URL(endpoint, 'http://localhost');
    } catch (e) {
      urlObj = new URL('/reports/export/pdf', 'http://localhost');
    }
    const startDate = urlObj.searchParams.get('startDate');
    const endDate = urlObj.searchParams.get('endDate');
    const type = urlObj.searchParams.get('type');
    const village = urlObj.searchParams.get('village');
    const workerId = urlObj.searchParams.get('workerId');

    // Filter collection
    let filtered = activities;
    
    // Workers can only export their own activities
    if (currentUser.role === 'worker') {
      filtered = filtered.filter(a => a.workerId === currentUser.id);
    } else if (workerId) {
      filtered = filtered.filter(a => a.workerId === workerId);
    }

    if (type) {
      filtered = filtered.filter(a => a.type === type);
    }
    if (village) {
      filtered = filtered.filter(a => a.village.toLowerCase() === village.toLowerCase());
    }
    if (startDate) {
      filtered = filtered.filter(a => a.date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(a => a.date <= endDate);
    }

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Stats calculations
    const totalLogs = filtered.length;
    const visitsCount = filtered.filter(a => a.type === 'visit').length;
    const interventionsCount = filtered.filter(a => a.type === 'intervention').length;
    const trainingsCount = filtered.filter(a => a.type === 'training').length;
    const urgentCount = filtered.filter(a => a.isUrgent).length;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Sanjeevani Health Outreach Summary Report (Demo Mode)</title>
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
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Sanjeevani Health Outreach Summary Report <span style="font-size:12px;color:#d97706;border:1px solid #d97706;padding:2px 5px;border-radius:4px;vertical-align:middle;margin-left:8px;">DEMO MODE</span></h1>
      <p>Ministry of Rural Health Outreach & Community Reporting System</p>
    </div>
    <div style="text-align: right">
      <div style="font-size: 12px; font-weight: bold; color: #0f766e">REPORT ID: SR-${Math.floor(Math.random() * 90000) + 10000}</div>
      <p>Generated: ${new Date().toLocaleString()}</p>
    </div>
  </div>

  <div class="meta-box">
    <div class="meta-grid">
      <div><strong>Supervisor/Requester:</strong> ${currentUser.name} (DEMO MODE)</div>
      <div><strong>Assigned Village Coverage:</strong> ${currentUser.village}</div>
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
      ${filtered.length > 0 ? filtered.map(a => `
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
    return { isMockPdf: true, htmlData: htmlContent };
  }

  if (endpoint.startsWith('/reports/export/communities-csv') && method === 'GET') {
    if (!currentUser || currentUser.role !== 'supervisor') throw new Error('Unauthorized');
    const communities = getCollection('sh_communities');
    const activities = getCollection('sh_activities');
    const alerts = getCollection('sh_alerts');

    // Parse query params in mock request
    let urlObj;
    try {
      urlObj = new URL(endpoint, 'http://localhost');
    } catch (e) {
      urlObj = new URL('/reports/export/communities-csv', 'http://localhost');
    }
    const startDate = urlObj.searchParams.get('startDate');
    const endDate = urlObj.searchParams.get('endDate');

    // Filter collection
    let filteredActivities = activities;
    if (startDate) {
      filteredActivities = filteredActivities.filter(a => a.date >= startDate);
    }
    if (endDate) {
      filteredActivities = filteredActivities.filter(a => a.date <= endDate);
    }

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

    const rows = communities.map(c => {
      const vActs = filteredActivities.filter(a => a.village.toLowerCase() === c.name.toLowerCase());
      const visits = vActs.filter(a => a.type === 'visit').length;
      const interventions = vActs.filter(a => a.type === 'intervention').length;
      const trainings = vActs.filter(a => a.type === 'training').length;
      const pendingAlerts = alerts.filter(a => a.village.toLowerCase() === c.name.toLowerCase() && a.status === 'pending').length;

      let trendStatus = 'Underserved Gap';
      if (pendingAlerts > 0) trendStatus = 'Critical Alert Active';
      else if (vActs.length >= 10) trendStatus = 'High Coverage';
      else if (vActs.length >= 3) trendStatus = 'Moderate Coverage';

      return [
        c.name,
        c.district,
        c.population,
        c.healthWorker,
        visits,
        interventions,
        trainings,
        vActs.length,
        pendingAlerts,
        trendStatus
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    return { isMockCsv: true, csvData: csvContent };
  }

  throw new Error(`Mock endpoint ${method} ${endpoint} not implemented`);
}
