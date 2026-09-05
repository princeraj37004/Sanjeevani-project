const express = require('express');
const router = express.Router();
const { CaseAlert } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

// GET ALL CASE ALERTS (Workers see their village alerts; Supervisors see all)
router.get('/', authenticate, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'worker') {
      query.village = req.user.village;
    }

    const alerts = await CaseAlert.find(query);
    
    // Sort by status ('pending' first) then date descending
    alerts.sort((a, b) => {
      if (a.status === 'pending' && b.status === 'resolved') return -1;
      if (a.status === 'resolved' && b.status === 'pending') return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json(alerts);
  } catch (err) {
    console.error('Fetch case alerts error:', err);
    res.status(500).json({ message: 'Server error fetching case alerts' });
  }
});

// RESOLVE CRITICAL CASE ALERT
router.put('/:id/resolve', authenticate, async (req, res) => {
  try {
    const { resolutionNotes } = req.body;

    if (!resolutionNotes) {
      return res.status(400).json({ message: 'Resolution notes are required to resolve a case alert' });
    }

    const alert = await CaseAlert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ message: 'Case alert not found' });
    }

    if (alert.status === 'resolved') {
      return res.status(400).json({ message: 'Case alert is already resolved' });
    }

    const updatedAlert = await CaseAlert.findByIdAndUpdate(req.params.id, {
      status: 'resolved',
      resolvedBy: req.user.name,
      resolutionNotes: resolutionNotes
    });

    res.json(updatedAlert);
  } catch (err) {
    console.error('Resolve case alert error:', err);
    res.status(500).json({ message: 'Server error resolving case alert' });
  }
});

module.exports = router;
