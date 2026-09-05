const express = require('express');
const router = express.Router();
const { Activity, CaseAlert } = require('../db');
const { authenticate } = require('../middleware/auth');

// GET ALL ACTIVITIES (Filtered by role)
router.get('/', authenticate, async (req, res) => {
  try {
    let query = {};
    
    // Workers can only see their own activities
    if (req.user.role === 'worker') {
      query.workerId = req.user.id;
    } else {
      // Supervisors can filter by worker, village, or urgency
      const { workerId, village, isUrgent, type } = req.query;
      if (workerId) query.workerId = workerId;
      if (village) query.village = village;
      if (isUrgent !== undefined) query.isUrgent = isUrgent === 'true';
      if (type) query.type = type;
    }

    const activities = await Activity.find(query);
    // Sort by date descending (since we are mocking, we can sort in memory)
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(activities);
  } catch (err) {
    console.error('Fetch activities error:', err);
    res.status(500).json({ message: 'Server error fetching activities' });
  }
});

// GET SINGLE ACTIVITY BY ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: 'Activity entry not found' });
    }

    // Workers cannot access other workers' logs
    if (req.user.role === 'worker' && activity.workerId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You do not own this entry' });
    }

    res.json(activity);
  } catch (err) {
    console.error('Fetch single activity error:', err);
    res.status(500).json({ message: 'Server error fetching activity' });
  }
});

// CREATE NEW ACTIVITY
router.post('/', authenticate, async (req, res) => {
  try {
    const { date, type, patientName, patientAge, patientGender, village, details, outcome, isUrgent } = req.body;

    if (!date || !type || !details || !outcome) {
      return res.status(400).json({ message: 'Please enter all required fields' });
    }

    const newActivity = await Activity.create({
      workerId: req.user.id,
      workerName: req.user.name,
      date,
      type, // 'visit', 'intervention', 'training'
      patientName: type === 'training' ? 'N/A' : (patientName || 'Anonymous'),
      patientAge: type === 'training' ? 0 : Number(patientAge || 0),
      patientGender: type === 'training' ? 'N/A' : (patientGender || 'Other'),
      village: req.user.role === 'worker' ? req.user.village : (village || 'Unassigned'),
      details,
      outcome,
      isUrgent: !!isUrgent
    });

    // Create a Critical Case Alert if flagged as urgent
    if (isUrgent) {
      await CaseAlert.create({
        activityId: newActivity._id,
        workerId: req.user.id,
        workerName: req.user.name,
        village: newActivity.village,
        patientName: newActivity.patientName,
        details: `CRITICAL CASE: Registered during field ${type}. Patient: ${newActivity.patientName}. Details: ${details}. Outcome/Status: ${outcome}.`,
        status: 'pending',
        resolvedBy: '',
        resolutionNotes: ''
      });
    }

    res.status(201).json(newActivity);
  } catch (err) {
    console.error('Create activity error:', err);
    res.status(500).json({ message: 'Server error creating activity' });
  }
});

// UPDATE ACTIVITY
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { date, type, patientName, patientAge, patientGender, village, details, outcome, isUrgent } = req.body;

    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: 'Activity entry not found' });
    }

    // Workers can only edit their own entries
    if (req.user.role === 'worker' && activity.workerId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You do not own this entry' });
    }

    const updatedData = {
      date: date || activity.date,
      type: type || activity.type,
      patientName: type === 'training' ? 'N/A' : (patientName || activity.patientName),
      patientAge: type === 'training' ? 0 : (patientAge !== undefined ? Number(patientAge) : activity.patientAge),
      patientGender: type === 'training' ? 'N/A' : (patientGender || activity.patientGender),
      village: req.user.role === 'worker' ? req.user.village : (village || activity.village),
      details: details || activity.details,
      outcome: outcome || activity.outcome,
      isUrgent: isUrgent !== undefined ? !!isUrgent : activity.isUrgent
    };

    const updatedActivity = await Activity.findByIdAndUpdate(req.params.id, updatedData);

    // Update or create alert if urgency changed
    const existingAlert = await CaseAlert.findOne({ activityId: req.params.id });

    if (updatedActivity.isUrgent && !existingAlert) {
      // Create new alert if it didn't exist
      await CaseAlert.create({
        activityId: updatedActivity._id,
        workerId: activity.workerId,
        workerName: activity.workerName,
        village: updatedActivity.village,
        patientName: updatedActivity.patientName,
        details: `CRITICAL CASE: Updated during field ${updatedActivity.type}. Patient: ${updatedActivity.patientName}. Details: ${updatedActivity.details}. Outcome: ${updatedActivity.outcome}.`,
        status: 'pending',
        resolvedBy: '',
        resolutionNotes: ''
      });
    } else if (!updatedActivity.isUrgent && existingAlert) {
      // Delete existing alert if toggled off critical
      await CaseAlert.findByIdAndDelete(existingAlert._id);
    } else if (existingAlert) {
      // Update patient name / details in alert
      await CaseAlert.findByIdAndUpdate(existingAlert._id, {
        patientName: updatedActivity.patientName,
        village: updatedActivity.village,
        details: `CRITICAL CASE: Updated during field ${updatedActivity.type}. Patient: ${updatedActivity.patientName}. Details: ${updatedActivity.details}. Outcome: ${updatedActivity.outcome}.`
      });
    }

    res.json(updatedActivity);
  } catch (err) {
    console.error('Update activity error:', err);
    res.status(500).json({ message: 'Server error updating activity' });
  }
});

// DELETE ACTIVITY
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: 'Activity entry not found' });
    }

    // Workers can only delete their own entries
    if (req.user.role === 'worker' && activity.workerId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You do not own this entry' });
    }

    await Activity.findByIdAndDelete(req.params.id);

    // Also delete any associated case alert
    const associatedAlert = await CaseAlert.findOne({ activityId: req.params.id });
    if (associatedAlert) {
      await CaseAlert.findByIdAndDelete(associatedAlert._id);
    }

    res.json({ message: 'Activity and any linked alerts deleted successfully' });
  } catch (err) {
    console.error('Delete activity error:', err);
    res.status(500).json({ message: 'Server error deleting activity' });
  }
});

module.exports = router;
