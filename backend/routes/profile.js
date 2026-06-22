const express = require('express');
const router = express.Router();
const Profile = require('../models/profile');

// POST /api/profile
router.post('/', async (req, res) => {
  try {
    const { username } = req.body;
    let profile = await Profile.findOne({ username });
    if (profile) {
      profile = await Profile.findOneAndUpdate({ username }, req.body, { new: true });
    } else {
      profile = await Profile.create(req.body);
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/profile/:username
router.get('/:username', async (req, res) => {
  try {
    const profile = await Profile.findOne({ username: req.params.username });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
