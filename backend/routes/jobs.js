const express = require('express');
const router = express.Router();
const Job = require('../models/job');

// ─── GET all jobs ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find().sort({ appliedDate: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET stats ────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const total = await Job.countDocuments({ status: { $ne: 'Saved' } });
    const saved = await Job.countDocuments({ status: 'Saved' });
    const applied = await Job.countDocuments({ status: 'Applied' });
    const interviews = await Job.countDocuments({ status: 'Interview' });
    const offered = await Job.countDocuments({ status: 'Offered' });
    const rejected = await Job.countDocuments({ status: 'Rejected' });

    // Most applied role
    const roleAgg = await Job.aggregate([
      { $match: { status: { $ne: 'Saved' } } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    const topRole = roleAgg.length > 0 ? roleAgg[0]._id : 'N/A';

    // Interview conversion rate
    const conversionRate = total > 0 ? ((interviews + offered) / total * 100).toFixed(1) : 0;
    const offerRate = total > 0 ? (offered / total * 100).toFixed(1) : 0;

    // Recent applications (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCount = await Job.countDocuments({
      status: { $ne: 'Saved' },
      appliedDate: { $gte: sevenDaysAgo }
    });

    res.json({
      total,
      saved,
      applied,
      interviews,
      offered,
      rejected,
      conversionRate,
      offerRate,
      topRole,
      recentCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST create job ──────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const newJob = new Job(req.body);
    const savedJob = await newJob.save();
    res.status(201).json(savedJob);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── POST create external job (Bookmarklet API) ─────────────────────────────
router.post('/external', async (req, res) => {
  // Allow cross-origin requests specifically for this endpoint
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Basic extraction heuristics from external pages
    let { company, role, location, link, description, source } = req.body;
    
    // Fallbacks if data is messy
    if (!company) company = "Unknown Company";
    if (!role) role = "Unknown Role";
    
    const newJob = new Job({
      company,
      role,
      location: location || "Remote",
      status: "Saved",
      appliedDate: new Date().toISOString(),
      link: link || "",
      notes: `Saved via Bookmarklet from ${source || 'the web'}.\n${description ? description.substring(0,200)+'...' : ''}`
    });
    
    const savedJob = await newJob.save();
    res.status(201).json({ success: true, job: savedJob });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// OPTIONS preflight for external
router.options('/external', (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.status(200).end();
});

// ─── PUT update job ───────────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedJob) return res.status(404).json({ error: 'Job not found' });
    res.json(updatedJob);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── DELETE job ───────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Job.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Job not found' });
    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;