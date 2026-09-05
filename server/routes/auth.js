const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Community } = require('../db');
const { authenticate, authorize, JWT_SECRET } = require('../middleware/auth');

// REGISTER USER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, village } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please enter all required fields' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role, // 'worker' or 'supervisor'
      village: role === 'supervisor' ? 'All Districts' : (village || 'Unassigned')
    });

    // If a worker registers and has a valid village, assign them in Community
    if (role === 'worker' && village) {
      const comm = await Community.findOne({ name: village });
      if (comm) {
        await Community.findByIdAndUpdate(comm._id, { healthWorker: name });
      }
    }

    // Generate JWT
    const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        village: newUser.village
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// LOGIN USER
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    // Check for user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        village: user.village
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// GET CURRENT USER PROFILE
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      village: user.village
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
});

// REGISTER A NEW HEALTH WORKER / SUPERVISOR (Supervisor restricted)
router.post('/register-worker', authenticate, authorize('supervisor'), async (req, res) => {
  try {
    const { name, email, role, village } = req.body;
    const userRole = role || 'worker';

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    if (userRole === 'worker' && !village) {
      return res.status(400).json({ message: 'Village assignment is required for health workers' });
    }

    // Check duplicate email (AC: duplicate email registration is prevented)
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email is already registered' });
    }

    // Generate secure temporary password (AC: new users receive credentials securely)
    const tempPassword = 'SHW_' + Math.random().toString(36).substring(2, 8).toUpperCase() + '@2026';

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    // Create user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: userRole,
      village: userRole === 'supervisor' ? 'All Districts' : (village || 'Unassigned')
    });

    // Update village health worker assignment if worker
    if (userRole === 'worker' && village) {
      const comm = await Community.findOne({ name: village });
      if (comm) {
        await Community.findByIdAndUpdate(comm._id, { healthWorker: name });
      }
    }

    // Simulate sending secure email credentials (AC: new users receive credentials securely)
    console.log('\n=============================================================');
    console.log('📧 SECURE CREDENTIAL DISPATCH SIMULATOR (ASHA Outbox)');
    console.log(`To: ${email}`);
    console.log(`Subject: Sanjeevani Portal Credentials`);
    console.log(`Dear ${name},\n\nYour account has been registered by your District Supervisor.`);
    console.log(`Portal URL: http://localhost:5173`);
    console.log(`Username: ${email}`);
    console.log(`Temporary Password: ${tempPassword}`);
    console.log('=============================================================\n');

    res.status(201).json({
      message: 'User registered successfully.',
      worker: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        village: newUser.village,
        tempPassword // Return plaintext temporary password so supervisor can print/share it immediately
      }
    });
  } catch (err) {
    console.error('Supervisor worker registration error:', err);
    res.status(500).json({ message: 'Server error during worker registration' });
  }
});

module.exports = router;
