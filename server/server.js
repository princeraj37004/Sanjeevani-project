const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const seedDatabase = require('./utils/seed');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets if in production
// (Vite build output can be hosted here if we build the app, which is a great touch)
app.use(express.static(path.join(__dirname, '..', 'dist')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/cases', require('./routes/cases'));
app.use('/api/communities', require('./routes/communities'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/patients', require('./routes/patients'));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Fallback to React index.html for SPA routing in production
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'), (err) => {
    if (err) {
      res.status(200).send('Rural Health Worker Activity Tracker Backend is Running. Access the frontend via Vite dev server.');
    }
  });
});

// Start Server & Seed Database
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Seed the mock database
  console.log('Initializing database seeding...');
  await seedDatabase();
  console.log('Backend server fully ready!');
});
