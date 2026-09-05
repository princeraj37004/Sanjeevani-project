const express = require('express');
const router = express.Router();
const { Community, Activity, CaseAlert } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

// GET ALL COMMUNITIES/VILLAGES
router.get('/', authenticate, async (req, res) => {
  try {
    const communities = await Community.find();
    res.json(communities);
  } catch (err) {
    console.error('Fetch communities error:', err);
    res.status(500).json({ message: 'Server error fetching community directory' });
  }
});

// CREATE NEW COMMUNITY
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, district, population, healthWorker, lat, lng } = req.body;

    if (!name || !district || !population) {
      return res.status(400).json({ message: 'Name, district, and population are required fields' });
    }

    // Check if village already exists
    const existing = await Community.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: 'Village already exists in directory' });
    }

    const newCommunity = await Community.create({
      name,
      district,
      population: Number(population),
      healthWorker: healthWorker || 'Unassigned',
      lat: lat ? Number(lat) : 0,
      lng: lng ? Number(lng) : 0
    });

    res.status(201).json(newCommunity);
  } catch (err) {
    console.error('Create community error:', err);
    res.status(500).json({ message: 'Server error creating community entry' });
  }
});

// GET COMMUNITY ANALYTICS SUMMARY (For maps and dashboard charts)
router.get('/stats', authenticate, async (req, res) => {
  try {
    const communities = await Community.find();
    const activities = await Activity.find();
    const alerts = await CaseAlert.find();

    const stats = communities.map(c => {
      const villageActivities = activities.filter(a => a.village.toLowerCase() === c.name.toLowerCase());
      const villageAlerts = alerts.filter(a => a.village.toLowerCase() === c.name.toLowerCase() && a.status === 'pending');

      return {
        _id: c._id,
        name: c.name,
        district: c.district,
        population: c.population,
        healthWorker: c.healthWorker,
        lat: c.lat,
        lng: c.lng,
        activityCount: villageActivities.length,
        pendingAlertsCount: villageAlerts.length,
        lastActivityDate: villageActivities.length > 0 
          ? villageActivities.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date
          : null
      };
    });

    res.json(stats);
  } catch (err) {
    console.error('Fetch community stats error:', err);
    res.status(500).json({ message: 'Server error compiling community stats' });
  }
});

module.exports = router;
